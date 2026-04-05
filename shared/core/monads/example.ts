import { BusinessFlow, flow, phaseFlow, ActionChain } from './monad.flow';
import { FlowRunner, FlowReport } from './runner';

const TraceMiddleware = async (step: { name: string }, data: unknown, next: () => Promise<unknown>) => {
    const start = Date.now();
    const result = await next();
    const duration = Date.now() - start;
    console.log(`[Trace] ${step.name} took ${duration}ms`);
    return result;
};

const loggerMiddleware = async (step: { name: string }, data: unknown, next: () => Promise<unknown>) => {
    console.log(`[Executing] ${step.name}...`);
    return await next();
};

const errorHandlerMiddleware = async (step: { name: string }, data: unknown, next: () => Promise<unknown>) => {
    try {
        return await next();
    } catch (error) {
        console.error(`[Error] ${step.name}:`, (error as Error).message);
        return { error: (error as Error).message };
    }
};

interface EmailAdapter {
    send(to: string, msg: string): Promise<boolean>;
}

interface DbAdapter {
    find(table: string, id: string): Promise<{ id: string; createdAt: string }>;
    save(table: string, data: unknown): Promise<{ id: string }>;
}

interface PaymentAdapter {
    charge(amount: number, card: string): Promise<{ success?: boolean; transactionId?: string; error?: string }>;
    refund(transactionId: string): Promise<{ success: boolean }>;
}

interface InventoryAdapter {
    checkStock(sku: string): Promise<boolean>;
    reserve(sku: string, qty: number): Promise<{ success: boolean; reservationId: string }>;
    release(reservationId: string): Promise<{ success: boolean }>;
}

const sendgridAdapter: EmailAdapter = {
    send: async (to, msg) => {
        console.log(`[SendGrid] Sending to ${to}: ${msg}`);
        return true;
    }
};

const mockDb: DbAdapter = {
    find: async (table, id) => {
        console.log(`[DB] Finding ${table}:${id}`);
        return { id, createdAt: new Date().toISOString() };
    },
    save: async (table, data) => {
        console.log(`[DB] Saving to ${table}:`, data);
        return { id: Math.random().toString(36).slice(2) };
    }
};

const mockPaymentGateway: PaymentAdapter = {
    charge: async (amount, card) => {
        console.log(`[Payment] Charging ${amount} to card ${card.slice(-4)}`);
        if (amount > 1000) return { error: 'Insufficient funds' };
        return { success: true, transactionId: `TX-${Date.now()}` };
    },
    refund: async (transactionId) => {
        console.log(`[Payment] Refunding ${transactionId}`);
        return { success: true };
    }
};

const mockInventory: InventoryAdapter = {
    checkStock: async (sku) => {
        console.log(`[Inventory] Checking ${sku}`);
        return true;
    },
    reserve: async (sku, qty) => {
        console.log(`[Inventory] Reserving ${qty}x ${sku}`);
        return { success: true, reservationId: `RES-${Date.now()}` };
    },
    release: async (reservationId) => {
        console.log(`[Inventory] Releasing ${reservationId}`);
        return { success: true };
    }
};

interface User { id: string; email: string; role: string }
interface Order { id?: string; userId: string; items: CartItem[]; total: number; transactionId?: string; paymentError?: string; reservations?: { success: boolean; reservationId: string }[] }
interface CartItem { sku: string; qty: number; price: number }

interface CheckoutData { cartId: number; total: number }
interface AuthData { email: string; password: string }

const EmailServiceFlow = (user: User) =>
    BusinessFlow.init<User>("EmailService", user)
        .check("Valid Email", u => u.email.includes("@"))
        .job("Send Welcome", async (u, deps) => {
            const email = deps.Email as EmailAdapter;
            await email.send(u.email, "Welcome!");
            return u;
        });

const Registration = BusinessFlow.init<User>("UserReg", { id: "", email: "martinez@test.com", role: "user" })
    .requires("Email", sendgridAdapter)
    .requires("db", mockDb)
    .action("Validate Data", (data) => ({
        ...data,
        email: data.email.toLowerCase().trim()
    }))
    .scope("Onboarding", ctx =>
        ctx.job("Welcome Email", (data, deps) => EmailServiceFlow(data))
    )
    .job("Persist User", async (data, deps) => {
        const db = deps.db as DbAdapter;
        const saved = await db.save("users", data);
        return { ...data, id: saved.id };
    })
    .yield(data => ({ success: true, user: data }));

const checkout = BusinessFlow.init<CheckoutData>("Checkout", { cartId: 123, total: 100 })
    .requires("Inventory", mockInventory)
    .rule("Valid Total", (data) => data.total > 0)
    .yield(data => ({ orderId: 'ABC', amount: data.total }));

const NotificationFlow2 = BusinessFlow.init("Notification", { email: "user@test.com" })
    .requires("Mailer", sendgridAdapter)
    .job("Send Welcome", async (data, deps) => {
        const mailer = deps.Mailer as EmailAdapter;
        const success = await mailer.send(data.email, "Hello!");
        return { ...data, notified: success };
    });

const OrderFlow = BusinessFlow.init<Order>("Order", { id: "", userId: "U1", items: [{ sku: 'ABC', qty: 2, price: 50 }], total: 100 })
    .requires("Inventory", mockInventory)
    .requires("Payment", mockPaymentGateway)
    .requires("db", mockDb)
    .check("Has Items", o => o.items.length > 0)
    .action("Calculate Total", (order) => ({
        ...order,
        total: order.items.reduce((sum, item) => sum + item.price * item.qty, 0)
    }))
    .rule("Valid Total", o => o.total > 0)
    .scope("Inventory Check", ctx =>
        ctx.job("Reserve Stock", async (order, deps) => {
            const inventory = deps.Inventory as InventoryAdapter;
            const reservations = await Promise.all(
                order.items.map(item => inventory.reserve(item.sku, item.qty))
            );
            return { ...order, reservations };
        })
    )
    .scope("Payment", ctx =>
        ctx.job("Charge Customer", async (order, deps) => {
            const payment = deps.Payment as PaymentAdapter;
            const result = await payment.charge(order.total, "4111111111111111");
            if (result.error) {
                return { ...order, paymentError: result.error };
            }
            return { ...order, transactionId: result.transactionId };
        })
            .rule("Payment Success", o => !o.paymentError)
    )
    .scope("Persistence", ctx =>
        ctx.job("Save Order", async (order, deps) => {
            const db = deps.db as DbAdapter;
            const saved = await db.save("orders", order);
            return { ...order, id: saved.id };
        })
    )
    .yield(order => ({
        orderId: order.id,
        transactionId: order.transactionId,
        total: order.total,
        itemCount: order.items.length
    } as { orderId: string; transactionId?: string; total: number; itemCount: number }));

const AuthFlow = BusinessFlow.init<AuthData>("AuthFlow", { email: "", password: "" })
    .requires("db", mockDb)
    .action("Sanitize Input", (data) => ({
        ...data,
        email: data.email.toLowerCase().trim()
    }))
    .check("Valid Email Format", d => d.email.includes("@"))
    .check("Password Not Empty", d => d.password.length >= 6)
    .job("Find User", async (data, deps) => {
        const db = deps.db as DbAdapter;
        const user = await db.find("users", data.email);
        return { ...data, user };
    })
    .rule("User Exists", d => !!(d as { user?: unknown }).user)
    .yield(d => ({
        authenticated: true,
        userId: (d as { user: { id: string } }).user.id
    }));

interface SagaStep {
    name: string;
    forward: () => Promise<unknown>;
    backward?: () => Promise<unknown>;
}

const SagaOrchestrator = (steps: SagaStep[]) => {
    const executedSteps: SagaStep[] = [];
    let flow = BusinessFlow.init("Saga", { stepResults: [] as { step: string; result: unknown }[] });

    for (const step of steps) {
        const currentStep = step;
        flow = flow.job(currentStep.name, async (data, _deps) => {
            try {
                const result = await currentStep.forward();
                executedSteps.push(currentStep);
                return { ...data, stepResults: [...data.stepResults, { step: currentStep.name, result }] };
            } catch (error) {
                for (const executed of executedSteps.reverse()) {
                    if (executed.backward) {
                        console.log(`[Saga] Compensating: ${executed.name}`);
                        await executed.backward();
                    }
                }
                throw error;
            }
        });
    }

    return flow;
};

const runner = new FlowRunner({ middlewares: [loggerMiddleware, TraceMiddleware], deps: { logger: console } });
const resilientRunner = new FlowRunner({ middlewares: [errorHandlerMiddleware, loggerMiddleware], deps: { logger: console } });

const printReport = (label: string, report: FlowReport) => console.log(`\n${label}:\n`, JSON.stringify(report, null, 2));

console.log("=== CHECKOUT FLOW ===");
runner.run(checkout).then(report => printReport("FINAL", report));

console.log("\n=== REGISTRATION FLOW ===");
runner.run(Registration).then(report => printReport("FINAL", report));

console.log("\n=== ORDER FLOW (Full Saga-like) ===");
runner.run(OrderFlow).then(report => printReport("FINAL", report));

console.log("\n=== AUTH FLOW ===");
resilientRunner.run(AuthFlow).then(report => printReport("FINAL", report));

console.log("\n=== SAGA ORCHESTRATOR EXAMPLE ===");
const saga = SagaOrchestrator([
    {
        name: "Reserve Inventory",
        forward: async () => mockInventory.reserve("SKU-001", 1),
        backward: async () => mockInventory.release("RES-001")
    },
    {
        name: "Process Payment",
        forward: async () => mockPaymentGateway.charge(100, "4111"),
        backward: async () => mockPaymentGateway.refund("TX-123")
    },
    {
        name: "Confirm Order",
        forward: async () => mockDb.save("orders", { sku: "SKU-001", qty: 1 })
    }
]);
runner.run(saga).then(report => printReport("FINAL", report));

console.log("\n=== NESTED SCOPES ===");
interface NestedData { level: number }
const NestedFlow = BusinessFlow.init<NestedData>("Parent", { level: 0 })
    .action("Increment Level", (d) => ({ ...d, level: d.level + 1 }))
    .scope("Outer Scope", ctx => ctx
        .action("Outer Task", (d) => ({ ...d, level: d.level + 1 }))
        .scope("Inner Scope", inner => inner
            .action("Inner Task", (d) => ({ ...d, level: d.level + 1 }))
        )
        .check("Level Check", d => d.level >= 2)
    )
    .yield(d => ({ finalLevel: d.level }));

runner.run(NestedFlow).then(report => printReport("FINAL", report));

console.log("\n=== FLOW BUILDER (Inferencia Automatica) ===");
interface PriceContext { price: number; qty: number; tax?: number; total?: number }
const priceFlow: ActionChain<PriceContext> = flow<PriceContext>("PriceCalculator", { price: 100, qty: 2 })
    .action("Calculate Subtotal", (ctx) => ({ ...ctx, subtotal: ctx.price * ctx.qty }))
    .action("Apply Tax", (ctx) => ({ ...ctx, tax: ctx.subtotal * 0.16 }))
    .action("Calculate Total", (ctx) => ({ ...ctx, total: ctx.subtotal + ctx.tax }));

console.log("Flow built, data flows automatically through steps");
const priceFlowInstance = priceFlow.toFlow("PriceCalculator");
runner.run(priceFlowInstance).then(report => printReport("PRICE FLOW", report));

console.log("\n=== PHASE FLOW (Fases Data -> Validate -> Effect -> Project) ===");
interface OrderPhase { items: CartItem[]; total: number; orderId?: string }
const OrderPhaseFlow = phaseFlow<OrderPhase, { db: DbAdapter }>("OrderPhase",
    { items: [{ sku: 'ITEM-1', qty: 1, price: 50 }], total: 0 },
    { db: mockDb }
);

OrderPhaseFlow
    .check("Has Items", o => o.items.length > 0)
    .action("Calculate Total", (o) => ({ ...o, total: o.items.reduce((s, i) => s + i.price * i.qty, 0) }))
    .effect("Save Order", async (o, deps) => {
        const db = deps as { db: DbAdapter };
        const saved = await db.db.save("orders", o);
        return { ...o, orderId: saved.id };
    })
    .project(o => ({ orderId: o.orderId, total: o.total }));

OrderPhaseFlow.run().then(result => {
    console.log("PHASE FLOW RESULT:", JSON.stringify(result, null, 2));
});

const orderFlow = OrderPhaseFlow.toFlow();
runner.run(orderFlow).then(report => printReport("ORDER PHASE -> BusinessFlow", report));
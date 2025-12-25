import { UserRole } from '@/data/mockData';

export const routes = {
  login: {
    screen: 'login',
    options: {
      headerShown: false,
      headerTitle: 'Login',
    },
  },
  "admin": {
    screen: '(admin)',
    options: {
      title: 'Admin',
    },
  },
  lister: {
    tabs: {
      screen: 'lister/(tabs)',
      options: {
        headerShown: false,
        headerTitle: '',
      },
    },
    bets_create: {
      screen: 'lister/bets_create/[id]',
      options: {
        headerShown: true,
        headerTitle: 'Anotar',
        headerBackVisible: true,
        freezeOnBlur: true,
      },
    },
    bets_list: {
      screen: 'lister/bets_list/[id]',
      options: {
        headerShown: true,
        headerTitle: 'Lista',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        freezeOnBlur: true,
      },
    },
    bets_rules: {
      screen: 'lister/bets_rules/[id]',
      options: {
        headerShown: true,
        headerTitle: 'Reglamento',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        freezeOnBlur: true,
      },
    },
    rewards: {
      screen: 'lister/rewards/[id]',
      options: {
        headerShown: true,
        headerTitle: 'Premios',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        freezeOnBlur: true,
      },
    },
  },
  colector: {
    tabs: {
      screen: 'colector/(tabs)',
      options: {
        headerShown: false,
        headerTitle: 'Dashboard',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        freezeOnBlur: true,
      },
    },
    details: {
      screen: 'details/[id]',
      options: {
        headerShown: true,
        headerTitle: '',
        headerBackTitle: 'Atrás',
        headerBackVisible: false,
        freezeOnBlur: true,
      },
    },
    dashboard: {
      screen: 'index',
      options: {
        title: 'Dashboard',
      }
    },
    operations: {
      screen: 'listas',
      options: {
        title: 'Mis Listas',
      }
    },
    reports: {
      screen: 'reports',
      options: {
        title: 'Mis Reportes',
      }
    },
    settings: {
      screen: 'settings',
      options: {
        title: 'Configuración',
      }
    },
    bets: {
      screen: 'bets',
      options: {
        href: null
      }
    },
    reports_form: {
      screen: 'reports/form',
      options: {
        headerShown: false,
        headerTitle: 'Reportar Incidencia',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        freezeOnBlur: true,
      },
    },
    update_rule:{
      screen:"update_rule",
       options: {
        headerShown: false,
        headerTitle: '',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        freezeOnBlur: true,
      }
    },
    node_rule:{
       screen:"rules",
       options: {
        headerShown: false,
        headerTitle: '',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        freezeOnBlur: true,
      },
    }

    
  }
}

export const roleToScreenMap: Record<UserRole | string, string> = {
  admin: '(admin)',
  listero: "lister",
  colector: 'colector/(tabs)',
  banker: 'banker',
};

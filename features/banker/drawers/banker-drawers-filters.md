# Task: Banker Drawers Filters & UI Optimization

## 📝 Overview
Implement topbar filters (Status, Type) and optimize the drawers list for mobile performance in the banker feature.

## 🏗️ Architecture (TEA)
- **Model**: Extended with `filters` state.
- **Msg**: Added `SET_STATUS_FILTER`, `SET_TYPE_FILTER`, `CLEAR_FILTERS`.
- **Update**: Pure logic for filter state transitions.
- **View**: Refactored to `FlatList` with `FilterTopBar`.

## 📱 Mobile Design Compliance
- [x] Min touch target 44pt.
- [x] `FlatList` instead of `ScrollView`.
- [ ] Optimized `renderItem` (Pending: currently inline).
- [x] Sticky headers for grouping.
- [x] Thumb zone consideration (Filters at top are standard but noted).

## 🛠️ Verification Plan
- [ ] Manual verification of filter logic.
- [ ] Performance check (no unnecessary re-renders).
- [ ] Touch target audit.
- [ ] No infinite loops on date/filter change.

## 📅 Progress
- [x] Initial implementation.
- [ ] Self-critique & Refactoring (Current).

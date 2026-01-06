export const bankerRoutes = {
  banker: {
    tabs: {
      screen: 'banker/(tabs)',
      options: {
        headerShown: false,
        headerTitle: 'Dashboard',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        freezeOnBlur: true,
      },
    },
    drawer: {
      screen: 'banker/drawers/[id]',
      options: {
        headerShown: false,
        headerTitle: 'Listas',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        freezeOnBlur: true,
      },
    },
    listerias: {
      screen: 'banker/listerias/[id]',
      options: {
        headerShown: false,
        headerTitle: 'Listas',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        freezeOnBlur: true,
      }
    },
    reports: {
      screen: 'banker/reports',
      options: {
        title: 'Reports',
      }
    },
    reports_form: {
      screen: 'banker/reports/form',
      options: {
        headerShown: false,
        headerTitle: 'Report Details',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        freezeOnBlur: true,
      },
    },
    dashboard: {
      screen: 'index',
      options: {
        title: 'Dashboard',
      }
    },
    rules: {
      screen: 'banker/rules',
      options: {
        headerShown: false,
        headerTitle: 'Bank Rules Management',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        freezeOnBlur: true,
      }
    },
    settings: {
      screen: 'banker/settings',
      options: {
        headerShown: false,
        headerTitle: 'Bank Settings',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        freezeOnBlur: true,
      }
    }
  }
};

export const colectorRoutes = {
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
};

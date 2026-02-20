export const COLECTOR_ROOT = '/colector/(tabs)';

export const colectorRoutes = {
  colector: {
    tabs: {
      screen: COLECTOR_ROOT,
      options: {
        headerShown: false,
        headerTitle: 'Dashboard',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        freezeOnBlur: true,
      },
    },
    details: {
      screen: '/colector/details/[id]',
      options: {
        headerShown: true,
        headerTitle: '',
        headerBackTitle: 'Atrás',
        headerBackVisible: false,
        freezeOnBlur: true,
      },
    },
    dashboard: {
      screen: '/index',
      options: {
        title: 'Dashboard',
      }
    },
    operations: {
      screen: '/listas',
      options: {
        title: 'Mis Listas',
      }
    },
    reports: {
      screen: '/reports',
      options: {
        title: 'Mis Reportes',
      }
    },
    settings: {
      screen: '/settings',
      options: {
        title: 'Configuración',
      }
    },
    bets: {
      screen: '/bets',
      options: {
        href: null
      }
    },
    reports_form: {
      screen: '/colector/reports/form',
      options: {
        headerShown: false,
        headerTitle: 'Reportar Incidencia',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        freezeOnBlur: true,
      },
    },
    update_rule:{
      screen: "/colector/update_rule",
       options: {
        headerShown: false,
        headerTitle: '',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        freezeOnBlur: true,
      }
    },
    node_rule:{
       screen: "/colector/rules",
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

export const listerRoutes = {
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
};

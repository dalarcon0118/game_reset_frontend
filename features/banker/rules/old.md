function Lista() {
  const rules = useRuleStore(selectRules);
  const dispatch = useRuleStore(state => state.dispatch);

  const renderItem = ({ item }: { item: Rule }) => (
    <Card style={styles.ruleCard}>
      <View style={styles.ruleRow}>
        <View style={styles.ruleInfo}>
          <Label type="header" style={styles.ruleName} value={item.name} />
          <Label type="detail" style={styles.ruleDescription} value={item.description} />
        </View>
        <View style={styles.toggleContainer}>
          <Switch
            value={item.isActive}
            onValueChange={() => dispatch(TOGGLE_RULE_REQUESTED(item.id, item.ruleType))}
            status="primary"
            style={{ transform: [{ scale: 0.7 }] }}
          />
        </View>
      </View>
    </Card>
  );

  React.useEffect(() => {
    dispatch({ type: 'FETCH_RULES_REQUESTED' });
  }, []);

  return (
    <FlatList
      data={rules}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
    />
  );
}

export default function RulesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const dispatch = useRuleStore(selectDispatch);

  return (
    <Flex flex={1} background={colors.background}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Flex align="center" gap={16} padding={16} style={styles.header}>
          <TouchableOpacity onPress={() =>  dispatch(ROUTER_BACK())}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity> 
          <Label type="title" value="Banker Rules" />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => dispatch(ROUTER_GO('/banker/rules/update'))}
          >
            <Plus size={24} color={colors.primary} />
          </TouchableOpacity>
        </Flex>
        <Lista />
      </SafeAreaView>
    </Flex>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  addButton: {
    marginLeft: 'auto',
    padding: 8,
    borderRadius: 8,
  },
  title: {
    textAlign: 'center',
    marginVertical: 20,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  ruleCard: {
    marginVertical: 8,
    borderRadius: 8,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  ruleInfo: {
    flex: 1,
    marginRight: 16,
  },
  ruleName: {
    marginBottom: 4,
  },
  ruleDescription: {
    color: '#8F9BB3',
  },
  toggleContainer: {
    justifyContent: 'center',
  },
});*/
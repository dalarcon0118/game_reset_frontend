import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Layout } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';

import RulesContent from './RulesContent';
import useDataFetch from '@/shared/hooks/useDataFetch';
import { RulesService } from '@/shared/services/rules';
import { DrawService } from '@/shared/services/Draw';

import { Text } from '@ui-kitten/components';
interface RulesScreenProps {
  drawId?: string;
}

export default function RulesScreen({ drawId }: RulesScreenProps) {
    const [oneDraw, draw,isLoading, errorDraws] = useDataFetch(DrawService.getOne);
    const [filterRules, rules,isLoadingRule, errorRule] = useDataFetch(RulesService.filter);

  useEffect(() => {
    if (drawId) {
      oneDraw(drawId);
      filterRules({drawId})
    }
  }, [drawId]);

  
  return (
    <Layout style={styles.container}>
        
      <ScrollView style={styles.scrollView}>
      {draw && (
        <View style={styles.titleContainer}>
          <Text category="h5" style={styles.title}>
            {draw.source}
          </Text>
        </View>
      )}
        <Layout style={styles.content}>
          {rules && <RulesContent rules={rules[0]} />}
        </Layout>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  titleContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
});
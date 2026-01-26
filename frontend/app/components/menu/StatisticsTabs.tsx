import { StyleSheet, Text, View, Pressable } from 'react-native'

export type ViewType = 'monthly' | 'weekly' | 'subject' | 'daily'

interface StatisticsTabsProps {
  value: ViewType
  onChange: (value: ViewType) => void
}

const StatisticsTabs = ({ value, onChange }: StatisticsTabsProps) => {

  const tabs: { label: string; key: ViewType }[] = [
    { label: '월별 보기', key: 'monthly' },
    { label: '주별 보기', key: 'weekly' },
    { label: '과목별 보기', key: 'subject' },
  ]

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = value === tab.key

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={[
              styles.tab,
              isActive && styles.activeTab,
            ]}
            onPress={() => onChange(tab.key)}
          >
            <Text
              style={[
                styles.text,
                isActive && styles.activeText,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export default StatisticsTabs

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: 16,
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#D8CFAF',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginHorizontal: 4,
  },

  activeTab: {
    backgroundColor: '#6B4E2E',
  },

  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A2A1A',
  },

  activeText: {
    color: '#FFFFFF',
  },
})

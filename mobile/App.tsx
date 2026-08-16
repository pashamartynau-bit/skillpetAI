import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const stats = [
  { label: 'Streak', value: '12 days', color: '#8b5cf6' },
  { label: 'Gems', value: '1,240', color: '#f59e0b' },
  { label: 'Hearts', value: '8', color: '#ef4444' },
  { label: 'XP', value: '8.4k', color: '#22c55e' },
];

const missions = [
  { title: 'Daily lesson', detail: 'Finish 1 AI module', reward: '+120 XP', done: true },
  { title: 'Practice quiz', detail: 'Score 90% on prompt design', reward: '+50 gems', done: false },
  { title: 'Mini challenge', detail: 'Complete 2 code tasks', reward: '+3 hearts', done: false },
];

const lessons = [
  { title: 'Intro to AI agents', duration: '12 min', level: 'Beginner' },
  { title: 'Prompt engineering', duration: '18 min', level: 'Intermediate' },
  { title: 'Data storytelling', duration: '10 min', level: 'Beginner' },
];

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.eyebrow}>Good morning</Text>
            <Text style={styles.title}>SkillPet AI</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileText}>JS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.petMeta}>
            <View style={styles.petBadge}>🐾</View>
            <View>
              <Text style={styles.petName}>Nova Pup</Text>
              <Text style={styles.petMood}>Ready for a new lesson</Text>
            </View>
          </View>

          <View style={styles.petArea}>
            <View style={styles.petBody}>
              <Text style={styles.petFace}>🐶</Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            <View>
              <Text style={styles.progressLabel}>Level 7</Text>
              <Text style={styles.progressValue}>78% to next evolution</Text>
            </View>
            <Text style={styles.progressPercent}>78%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={styles.progressBarFill} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your progress</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statDot, { backgroundColor: stat.color }]} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Today's missions</Text>
        <View style={styles.missionList}>
          {missions.map((mission) => (
            <View key={mission.title} style={styles.missionCard}>
              <View style={styles.missionTextWrap}>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <Text style={styles.missionDetail}>{mission.detail}</Text>
              </View>
              <View style={styles.missionRewardBox}>
                <Text style={styles.missionReward}>{mission.reward}</Text>
                <View style={[styles.checkDot, mission.done && styles.checkDotDone]}>
                  {mission.done ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Continue learning</Text>
        {lessons.map((lesson) => (
          <TouchableOpacity key={lesson.title} style={styles.lessonCard}>
            <View style={styles.lessonBadge}>
              <Text style={styles.lessonBadgeText}>{lesson.level}</Text>
            </View>
            <View style={styles.lessonMeta}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonDuration}>{lesson.duration}</Text>
            </View>
            <Text style={styles.lessonArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#08111f',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    backgroundColor: '#08111f',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 12,
    color: '#9faeca',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f5f7ff',
    marginTop: 2,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1d2f4f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3650a1',
  },
  profileText: {
    color: '#dbeafe',
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#101d35',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: '#24365f',
    marginBottom: 26,
  },
  petMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  petBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#1c2d4b',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
  },
  petName: {
    color: '#f3f6ff',
    fontSize: 20,
    fontWeight: '700',
  },
  petMood: {
    color: '#a7b7d9',
    fontSize: 12,
    marginTop: 2,
  },
  petArea: {
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petBody: {
    width: 162,
    height: 162,
    borderRadius: 81,
    backgroundColor: '#7dd3fc',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5eead4',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  petFace: {
    fontSize: 68,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 18,
  },
  progressLabel: {
    color: '#edf5ff',
    fontWeight: '700',
    fontSize: 16,
  },
  progressValue: {
    color: '#9db1d0',
    fontSize: 12,
    marginTop: 4,
  },
  progressPercent: {
    color: '#72f0c7',
    fontWeight: '800',
    fontSize: 18,
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#1d2f4f',
    overflow: 'hidden',
    marginTop: 10,
  },
  progressBarFill: {
    width: '78%',
    height: '100%',
    backgroundColor: '#5eead4',
    borderRadius: 999,
  },
  sectionTitle: {
    color: '#edf5ff',
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#101d35',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#24365f',
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 14,
  },
  statValue: {
    color: '#f6f9ff',
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: '#9db1d0',
    fontSize: 12,
    marginTop: 4,
  },
  missionList: {
    gap: 10,
    marginBottom: 20,
  },
  missionCard: {
    backgroundColor: '#101d35',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#24365f',
  },
  missionTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  missionTitle: {
    color: '#eef4ff',
    fontWeight: '700',
    fontSize: 15,
  },
  missionDetail: {
    color: '#9db1d0',
    fontSize: 12,
    marginTop: 4,
  },
  missionRewardBox: {
    alignItems: 'center',
    gap: 8,
  },
  missionReward: {
    color: '#fde68a',
    fontSize: 11,
    fontWeight: '700',
  },
  checkDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#5b6f9d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDotDone: {
    backgroundColor: '#34d399',
    borderColor: '#34d399',
  },
  checkMark: {
    color: '#052e2b',
    fontWeight: '800',
    fontSize: 12,
  },
  lessonCard: {
    backgroundColor: '#101d35',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#24365f',
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#1a365a',
    marginRight: 12,
  },
  lessonBadgeText: {
    color: '#bfdbfe',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  lessonMeta: {
    flex: 1,
  },
  lessonTitle: {
    color: '#edf6ff',
    fontSize: 15,
    fontWeight: '700',
  },
  lessonDuration: {
    color: '#9db1d0',
    fontSize: 12,
    marginTop: 4,
  },
  lessonArrow: {
    color: '#90cdf4',
    fontSize: 28,
    fontWeight: '700',
  },
});

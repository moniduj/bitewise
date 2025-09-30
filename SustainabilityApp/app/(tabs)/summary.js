import { View, Text, StyleSheet } from 'react-native';

export default function SummaryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>📊 Summary Screen</Text>
      <Text style={styles.subtext}>Your sustainability summary will be shown here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#555',
  },
});

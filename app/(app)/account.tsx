
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/context/Auth';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function Account() {
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');

  const getProfileCallback = useCallback(() => {
    getProfile();
  }, [session?.user?.id]);

  useEffect(() => {
    if (session) getProfileCallback();
  }, [session, getProfileCallback]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website`)
        .eq('id', session?.user.id)
        .single();
      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username);
        setWebsite(data.website);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({ username, website }: { username: string; website: string }) {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const updates = {
        id: session?.user.id,
        username,
        website,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out';
      Alert.alert('Error', message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input value={session?.user?.email} editable={false} placeholder="Email" />
      </View>
      <View style={styles.verticallySpaced}>
        <Input placeholder="Username" value={username || ''} onChangeText={(text: string) => setUsername(text)} />
      </View>
      <View style={styles.verticallySpaced}>
        <Input placeholder="Website" value={website || ''} onChangeText={(text: string) => setWebsite(text)} />
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button
          title={loading ? 'Loading ...' : 'Update'}
          onPress={() => updateProfile({ username, website })}
          disabled={loading}
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Button title="Sign Out" onPress={handleSignOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

export default function SupabaseTest() {
    const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');

    useEffect(() => {
        testConnection();
    }, []);

    const testConnection = async () => {
        try {
            const { data, error } = await supabase
                .from('_test')
                .select('*')
                .limit(1);

            if (error) {
                // This is expected - we're just testing if we can connect
                if (error.message.includes('relation "_test" does not exist')) {
                    setConnectionStatus('✅ Connected to Supabase!');
                } else {
                    setConnectionStatus(`❌ Error: ${error.message}`);
                }
            } else {
                setConnectionStatus('✅ Connected to Supabase!');
            }
        } catch (error) {
            setConnectionStatus(`❌ Connection failed: ${error}`);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Supabase Connection Test</Text>
            <Text style={styles.status}>{connectionStatus}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    status: {
        fontSize: 16,
        textAlign: 'center',
    },
}); 
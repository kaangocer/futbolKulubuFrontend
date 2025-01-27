import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import axios from 'axios';

export default function RegisterPanel({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError('Tüm alanları doldurunuz!');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Geçerli bir e-posta adresi giriniz!');
      return false;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır!');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor!');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setError('');
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axios.post('http://192.168.1.21:3000/kullanicilar', {
        Email: email.trim(),
        Password: password,
        RolId: 1  
      });

      if (response.data) {
        Alert.alert(
          'Başarılı',
          'Kayıt işleminiz başarıyla tamamlandı. Giriş yapabilirsiniz.',
          [{ 
            text: 'Tamam',
            onPress: () => navigation.goBack()
          }]    
        );
      }
    } catch (error) {
      console.error('Register error:', error);
      let errorMessage = 'Kayıt olurken bir hata oluştu!';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error?.includes('violates unique constraint')) {
        errorMessage = 'Bu e-posta adresi zaten kayıtlı!';
      } else if (error.response?.data?.error?.includes('foreign key constraint')) {
        errorMessage = 'Geçersiz rol seçimi!';
      }
      
      setError(errorMessage);
      Alert.alert('Hata', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Kayıt Ol</Text>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TextInput
          style={styles.input}
          placeholder="E-posta"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre Tekrar"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
  },
  backButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
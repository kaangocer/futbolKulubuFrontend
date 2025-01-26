import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, StyleSheet, ScrollView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

const Uyeler = () => {
    const [uyeler, setUyeler] = useState([]);
    const [selectedUye, setSelectedUye] = useState(null);
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [formData, setFormData] = useState({
        KullaniciId: '1', 
        GrupId: '',
        TcNo: '',
        Ad: '',
        SoyAd: '',
        TelNo: '',
        DogumYili: '',
        AnneAdi: '',
        BabaAdi: '',
        AnneTelNo: '',
        BabaTelNo: '',
        Adres: '',
    });

    const API_BASE_URL = 'http://192.168.1.21:3000';

    useEffect(() => {
        fetchUyeler();
    }, []);

    const validateForm = () => {
        if (!formData.TcNo || formData.TcNo.length !== 11) {
            Alert.alert('Hata', 'TC Kimlik No 11 haneli olmalıdır.');
            return false;
        }
        if (!formData.Ad || !formData.SoyAd) {
            Alert.alert('Hata', 'Ad ve Soyad alanları zorunludur.');
            return false;
        }
        if (!formData.TelNo || formData.TelNo.length < 10) {
            Alert.alert('Hata', 'Geçerli bir telefon numarası giriniz.');
            return false;
        }
        return true;
    };

    const resetForm = () => {
        setFormData({
            KullaniciId: '1',
            GrupId: '',
            TcNo: '',
            Ad: '',
            SoyAd: '',
            TelNo: '',
            DogumYili: '',
            AnneAdi: '',
            BabaAdi: '',
            AnneTelNo: '',
            BabaTelNo: '',
            Adres: '',
        });
        setSelectedUye(null);
    };

    const fetchUyeler = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/uyeler`);
            const sortedUyeler = response.data.sort((a, b) => {
                const nameA = `${a.Ad} ${a.SoyAd}`.toLowerCase();
                const nameB = `${b.Ad} ${b.SoyAd}`.toLowerCase();
                return nameA.localeCompare(nameB);
            });
            setUyeler(sortedUyeler);
        } catch (error) {
            console.error('Hata detayı:', error);
            Alert.alert('Hata', 'Üyeler alınırken bir hata oluştu.');
        }
    };

    const getYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = currentYear; year >= 1950; year--) {
            years.push(year);
        }
        return years;
    };

    const renderYearPicker = () => (
        <View style={styles.pickerContainer}>
            <Picker
                selectedValue={formData.DogumYili}
                style={styles.picker}
                onValueChange={(itemValue) => 
                    setFormData({ ...formData, DogumYili: itemValue.toString() })
                }
            >
                <Picker.Item label="Doğum Yılı Seçin" value="" />
                {getYearOptions().map(year => (
                    <Picker.Item 
                        key={year.toString()} 
                        label={year.toString()} 
                        value={year.toString()}
                    />
                ))}
            </Picker>
        </View>
    );

    const handleAddUye = async () => {
        if (!validateForm()) return;

        try {
            const uyeData = {
                ...formData,
                KullaniciId: parseInt(formData.KullaniciId),
                GrupId: parseInt(formData.GrupId),
                DogumYili: parseInt(formData.DogumYili)
            };

            

            const response = await axios.post(`${API_BASE_URL}/uyeler`, uyeData);
            const newUyeler = [...uyeler, response.data].sort((a, b) => {
                const nameA = `${a.Ad} ${a.SoyAd}`.toLowerCase();
                const nameB = `${b.Ad} ${b.SoyAd}`.toLowerCase();
                return nameA.localeCompare(nameB);
            });
            setUyeler(newUyeler);
            Alert.alert('Başarılı', 'Üye başarıyla eklendi');
            resetForm();
        } catch (error) {
            console.error('Hata detayı:', error.response?.data || error.message);
            Alert.alert('Hata', 'Üye eklenirken bir hata oluştu');
        }
    };

    const handleUpdateUye = async () => {
        if (!selectedUye || !validateForm()) return;

        try {
            const uyeData = {
                KullaniciId: 1,  // Sabit değer
                GrupId: parseInt(formData.GrupId) || 1,
                TcNo: formData.TcNo,
                Ad: formData.Ad,
                SoyAd: formData.SoyAd,
                TelNo: formData.TelNo,
                DogumYili: parseInt(formData.DogumYili) || null,
                AnneAdi: formData.AnneAdi,
                BabaAdi: formData.BabaAdi,
                AnneTelNo: formData.AnneTelNo,
                BabaTelNo: formData.BabaTelNo,
                Adres: formData.Adres
            };

            

            const response = await axios.put(`${API_BASE_URL}/uyeler/${selectedUye.UyeId}`, uyeData);
            const updatedUyeler = uyeler.map(uye => 
                uye.UyeId === selectedUye.UyeId ? response.data : uye
            ).sort((a, b) => {
                const nameA = `${a.Ad} ${a.SoyAd}`.toLowerCase();
                const nameB = `${b.Ad} ${b.SoyAd}`.toLowerCase();
                return nameA.localeCompare(nameB);
            });
            
            setUyeler(updatedUyeler);
            Alert.alert('Başarılı', 'Üye başarıyla güncellendi');
            resetForm();
        } catch (error) {
            console.error('Hata detayı:', error.response?.data || error.message);
            Alert.alert('Hata', 'Üye güncellenirken bir hata oluştu');
        }
    };

    const handleDeleteUye = async (UyeId) => {
        Alert.alert(
            'Onay',
            'Bu üyeyi silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await axios.delete(`${API_BASE_URL}/uyeler/${UyeId}`);
                            if (response.status === 200) {
                                const newUyeler = uyeler.filter(uye => uye.UyeId !== UyeId);
                                setUyeler(newUyeler);
                                Alert.alert('Başarılı', 'Üye başarıyla silindi');
                                resetForm();
                            }
                        } catch (error) {
                            console.error('Silme hatası:', error.response?.data);
                            Alert.alert(
                                'Hata',
                                'Üye silinirken bir hata oluştu. Bu üye başka tablolarla ilişkili olabilir.'
                            );
                        }
                    }
                }
            ]
        );
    };

    const selectUyeForUpdate = (uye) => {
        setSelectedUye(uye);
        setFormData({
            KullaniciId: String(uye.KullaniciId || 1),
            GrupId: String(uye.GrupId || 1),
            TcNo: uye.TcNo || '',
            Ad: uye.Ad || '',
            SoyAd: uye.SoyAd || '',
            TelNo: uye.TelNo || '',
            DogumYili: String(uye.DogumYili || ''),
            AnneAdi: uye.AnneAdi || '',
            BabaAdi: uye.BabaAdi || '',
            AnneTelNo: uye.AnneTelNo || '',
            BabaTelNo: uye.BabaTelNo || '',
            Adres: uye.Adres || ''
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Üye İşlemleri</Text>
            <ScrollView style={styles.formContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="TC Kimlik No (11 haneli)"
                    value={formData.TcNo}
                    onChangeText={(text) => setFormData({ ...formData, TcNo: text })}
                    maxLength={11}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Grup ID"
                    value={formData.GrupId}
                    onChangeText={(text) => setFormData({ ...formData, GrupId: text })}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Ad"
                    value={formData.Ad}
                    onChangeText={(text) => setFormData({ ...formData, Ad: text })}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Soyad"
                    value={formData.SoyAd}
                    onChangeText={(text) => setFormData({ ...formData, SoyAd: text })}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Telefon Numarası"
                    value={formData.TelNo}
                    onChangeText={(text) => setFormData({ ...formData, TelNo: text })}
                    keyboardType="phone-pad"
                />
                {renderYearPicker()}
                <TextInput
                    style={styles.input}
                    placeholder="Anne Adı"
                    value={formData.AnneAdi}
                    onChangeText={(text) => setFormData({ ...formData, AnneAdi: text })}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Baba Adı"
                    value={formData.BabaAdi}
                    onChangeText={(text) => setFormData({ ...formData, BabaAdi: text })}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Anne Tel No"
                    value={formData.AnneTelNo}
                    onChangeText={(text) => setFormData({ ...formData, AnneTelNo: text })}
                    keyboardType="phone-pad"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Baba Tel No"
                    value={formData.BabaTelNo}
                    onChangeText={(text) => setFormData({ ...formData, BabaTelNo: text })}
                    keyboardType="phone-pad"
                />
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="Adres"
                    value={formData.Adres}
                    onChangeText={(text) => setFormData({ ...formData, Adres: text })}
                    multiline
                />

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.addButton]}
                        onPress={selectedUye ? handleUpdateUye : handleAddUye}
                    >
                        <Text style={styles.buttonText}>
                            {selectedUye ? 'Güncelle' : 'Ekle'}
                        </Text>
                    </TouchableOpacity>
                    {selectedUye && (
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={resetForm}
                        >
                            <Text style={styles.buttonText}>İptal</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            <View style={styles.listContainer}>
                <Text style={styles.listHeader}>Üye Listesi</Text>
                <FlatList
                    data={uyeler}
                    keyExtractor={(item) => item.UyeId.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.listItem}>
                            <View style={styles.userInfo}>
                                <View style={styles.userNameContainer}>
                                    <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                                        {item.Ad} {item.SoyAd}
                                    </Text>
                                </View>
                                <View style={styles.userDetailsContainer}>
                                    <View style={styles.userDetailRow}>
                                        <Text style={styles.userDetailLabel}>TC:</Text>
                                        <Text style={styles.userDetailText} numberOfLines={1}>
                                            {item.TcNo}
                                        </Text>
                                    </View>
                                    <View style={styles.userDetailRow}>
                                        <Text style={styles.userDetailLabel}>Tel:</Text>
                                        <Text style={styles.userDetailText} numberOfLines={1}>
                                            {item.TelNo}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.button, styles.editButton]}
                                    onPress={() => selectUyeForUpdate(item)}
                                >
                                    <Text style={styles.buttonText}>Düzenle</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.deleteButton]}
                                    onPress={() => handleDeleteUye(item.UyeId)}
                                >
                                    <Text style={styles.buttonText}>Sil</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#2c3e50',
    },
    formContainer: {
        maxHeight: '50%',
    },
    input: {
        height: 40,
        borderColor: '#bdc3c7',
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    multilineInput: {
        height: 60,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    button: {
        padding: 8,
        borderRadius: 6,
        marginLeft: 8,
        minWidth: 70,
        alignItems: 'center',
    },
    addButton: {
        backgroundColor: '#2ecc71',
    },
    editButton: {
        backgroundColor: '#3498db',
    },
    deleteButton: {
        backgroundColor: '#e74c3c',
    },
    cancelButton: {
        backgroundColor: '#95a5a6',
    },
    buttonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
    listContainer: {
        flex: 1,
        marginTop: 10,
    },
    listHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 10,
        color: '#2c3e50',
    },
    listItem: {
        backgroundColor: '#fff',
        padding: 12,
        marginBottom: 8,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    userInfo: {
        flex: 1,
        marginRight: 10,
    },
    userNameContainer: {
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    userDetailsContainer: {
        flex: 1,
    },
    userDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    userDetailLabel: {
        fontSize: 14,
        color: '#7f8c8d',
        width: 35,
        fontWeight: '500',
    },
    userDetailText: {
        fontSize: 14,
        color: '#34495e',
        flex: 1,
        marginRight: 5,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 160,
    },
    placeholderText: {
        color: '#7f8c8d',
        paddingVertical: 10,
    },
    dateText: {
        color: '#2c3e50',
        paddingVertical: 10,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#bdc3c7',
        borderRadius: 5,
        marginBottom: 10,
        backgroundColor: '#fff',
        justifyContent: 'center',
        height: 40,
    },
    picker: {
        height: 40,
        width: '100%',
        marginTop: Platform.OS === 'android' ? -8 : 0,
        marginBottom: Platform.OS === 'android' ? -8 : 0,
    },
});

export default Uyeler;

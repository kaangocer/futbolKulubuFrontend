import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';

function AidatListeleme() {
  const [uyeler, setUyeler] = useState([]);
  const [filteredUyeler, setFilteredUyeler] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [showAylar, setShowAylar] = useState(false);
  const [seciliUyeAidatlari, setSeciliUyeAidatlari] = useState([]);
  const [yeniAidat, setYeniAidat] = useState({
    UyeId: '',
    Yil: new Date().getFullYear().toString(),
    Ay: '',
    Miktar: '',
    Durum: 'Ödendi'
  });
  const [selectedAidat, setSelectedAidat] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showUpdateAylar, setShowUpdateAylar] = useState(false);

  const aylar = [
    { label: 'Ocak', value: '1' },
    { label: 'Şubat', value: '2' },
    { label: 'Mart', value: '3' },
    { label: 'Nisan', value: '4' },
    { label: 'Mayıs', value: '5' },
    { label: 'Haziran', value: '6' },
    { label: 'Temmuz', value: '7' },
    { label: 'Ağustos', value: '8' },
    { label: 'Eylül', value: '9' },
    { label: 'Ekim', value: '10' },
    { label: 'Kasım', value: '11' },
    { label: 'Aralık', value: '12' }
  ];

  // Üyeleri getir
  const getUyeler = async () => {
    try {
      const response = await axios.get('http://192.168.1.21:3000/uyeler');
      if (response.data) {
        setUyeler(response.data);
        setFilteredUyeler(response.data);
      }
    } catch (error) {
      console.error('Hata:', error);
      alert('Üyeler yüklenirken hata oluştu');
    }
  };

  // Seçili üyenin aidatlarını getir
  const getUyeAidatlari = async (uyeId) => {
    try {
      const response = await axios.get('http://192.168.1.21:3000/aidatlar');
      if (response.data) {
        // Seçili üyenin aidatlarını filtrele
        const uyeAidatlari = response.data.filter(aidat => aidat.UyeId === parseInt(uyeId));
        // Aidatları yıl ve aya göre sırala
        const siraliAidatlar = uyeAidatlari.sort((a, b) => {
          if (a.Yil !== b.Yil) return b.Yil - a.Yil;
          return b.Ay - a.Ay;
        });
        setSeciliUyeAidatlari(siraliAidatlar);
      }
    } catch (error) {
      console.error('Hata:', error);
      alert('Aidat bilgileri yüklenirken hata oluştu');
    }
  };

  useEffect(() => {
    getUyeler();
  }, []);

  // Üye filtreleme
  const handleSearch = (text) => {
    setSearchText(text);
    const filtered = uyeler.filter(uye => 
      `${uye.Ad} ${uye.SoyAd} ${uye.TcNo}`
        .toLowerCase()
        .includes(text.toLowerCase())
    );
    setFilteredUyeler(filtered);
  };

  const handleChange = (name, value) => {
    setYeniAidat(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!yeniAidat.UyeId || !yeniAidat.Yil || !yeniAidat.Ay || !yeniAidat.Miktar) {
        alert('Lütfen tüm alanları doldurunuz');
        return;
      }

      // Seçilen ay ve yıl için aidat kontrolü
      const mevcutAidat = seciliUyeAidatlari.find(
        aidat => 
          aidat.Yil.toString() === yeniAidat.Yil &&
          aidat.Ay.toString() === yeniAidat.Ay
      );

      if (mevcutAidat) {
        alert(`${yeniAidat.Yil} yılı ${aylar.find(a => a.value === yeniAidat.Ay)?.label} ayı için zaten aidat kaydı mevcut!`);
        return;
      }

      const formattedAidat = {
        UyeId: parseInt(yeniAidat.UyeId),
        Yil: parseInt(yeniAidat.Yil),
        Ay: parseInt(yeniAidat.Ay),
        Miktar: parseFloat(yeniAidat.Miktar),
        Durum: yeniAidat.Durum,
        OdemeTarihi: new Date().toISOString()
      };

      await axios.post('http://192.168.1.21:3000/aidatlar', formattedAidat);
      alert('Aidat başarıyla eklendi');
      
      // Formu sıfırla
      setYeniAidat({
        UyeId: yeniAidat.UyeId, // Seçili üyeyi koru
        Yil: new Date().getFullYear().toString(),
        Ay: '',
        Miktar: '',
        Durum: 'Ödendi'
      });
      
      // Aidat listesini güncelle
      getUyeAidatlari(yeniAidat.UyeId);
    } catch (error) {
      console.error('Hata:', error);
      alert('Aidat eklenirken hata oluştu: ' + error.message);
    }
  };

  const handleUyeSelect = async (uyeId) => {
    handleChange('UyeId', uyeId.toString());
    await getUyeAidatlari(uyeId);
  };

  // Aidat durumuna göre renk belirleme
  const getDurumRengi = (durum) => {
    switch (durum) {
      case 'Ödendi': return '#4CAF50';
      case 'Ödenmedi': return '#FF3B30';
      default: return '#FFC107';
    }
  };

  // Yıla göre aidatları grupla
  const groupByYil = (aidatlar) => {
    return aidatlar.reduce((groups, aidat) => {
      const yil = aidat.Yil;
      if (!groups[yil]) {
        groups[yil] = [];
      }
      groups[yil].push(aidat);
      return groups;
    }, {});
  };

  // Aidata tıklandığında
  const handleAidatPress = (aidat) => {
    setSelectedAidat(aidat);
    setShowUpdateModal(true);
  };

  // Aidat güncelleme
  const handleUpdate = async () => {
    try {
      if (!selectedAidat?.AidatId) return;

      const updateData = {
        Yil: selectedAidat.Yil,
        Ay: selectedAidat.Ay,
        Miktar: selectedAidat.Miktar,
        Durum: selectedAidat.Durum,
        OdemeTarihi: new Date().toISOString()
      };

      await axios.put(`http://192.168.1.21:3000/aidatlar/${selectedAidat.AidatId}`, updateData);
      alert('Aidat başarıyla güncellendi');
      setShowUpdateModal(false);
      getUyeAidatlari(selectedAidat.UyeId); // Listeyi yenile
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      alert('Güncelleme sırasında bir hata oluştu');
    }
  };

  // Aidat silme
  const handleDelete = async (aidatId) => {
    try {
      Alert.alert(
        'Silme Onayı',
        'Bu aidatı silmek istediğinizden emin misiniz?',
        [
          {
            text: 'İptal',
            style: 'cancel',
          },
          {
            text: 'Sil',
            onPress: async () => {
              try {
                await axios.delete(`http://192.168.1.21:3000/aidatlar/${aidatId}`);
                alert('Aidat başarıyla silindi');
                setShowUpdateModal(false);
                getUyeAidatlari(selectedAidat.UyeId); // Listeyi yenile
              } catch (error) {
                console.error('Silme hatası:', error);
                alert('Silme sırasında bir hata oluştu');
              }
            },
            style: 'destructive',
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme sırasında bir hata oluştu');
    }
  };

  // Güncelleme modalındaki değişiklikleri handle et
  const handleUpdateChange = (field, value) => {
    setSelectedAidat(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Ay seçimi için dropdown
  const renderAySecimi = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Ay:</Text>
      <TouchableOpacity
        style={styles.aySelector}
        onPress={() => setShowAylar(!showAylar)}
      >
        <Text style={styles.aySelectorText}>
          {yeniAidat.Ay ? aylar.find(a => a.value === yeniAidat.Ay)?.label : 'Ay Seçiniz'}
        </Text>
      </TouchableOpacity>
      
      {showAylar && (
        <View style={styles.aylarDropdownContainer}>
          <ScrollView 
            style={styles.aylarScrollView}
            nestedScrollEnabled={true}
          >
            {aylar.map(ay => (
              <TouchableOpacity
                key={ay.value}
                style={[
                  styles.ayItem,
                  yeniAidat.Ay === ay.value && styles.selectedAy
                ]}
                onPress={() => {
                  handleChange('Ay', ay.value);
                  setShowAylar(false);
                }}
              >
                <Text style={[
                  styles.ayItemText,
                  yeniAidat.Ay === ay.value && styles.selectedAyText
                ]}>
                  {ay.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Yeni Aidat Ekle</Text>
          
          {/* Üye Arama */}
          <View style={styles.searchContainer}>
            <Text style={styles.label}>Üye Ara:</Text>
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={handleSearch}
              placeholder="Ad, Soyad veya TC No ile ara..."
            />
          </View>

          {/* Üye Listesi */}
          <View style={styles.uyeListContainer}>
            <ScrollView 
              style={styles.uyeListScrollContainer}
              nestedScrollEnabled={true}
            >
              {filteredUyeler.map(uye => (
                <TouchableOpacity
                  key={uye.UyeId}
                  style={[
                    styles.uyeItem,
                    yeniAidat.UyeId === uye.UyeId?.toString() && styles.selectedUye
                  ]}
                  onPress={() => handleUyeSelect(uye.UyeId)}
                >
                  <View style={styles.uyeInfo}>
                    <Text style={styles.uyeText}>{uye.Ad} {uye.SoyAd}</Text>
                    <Text style={styles.tcText}>TC: {uye.TcNo}</Text>
                  </View>
                  {yeniAidat.UyeId === uye.UyeId?.toString() && (
                    <Text style={styles.selectedText}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Seçili Üyenin Aidat Geçmişi */}
          {yeniAidat.UyeId && (
            <View style={styles.aidatGecmisiContainer}>
              <Text style={styles.subtitle}>Aidat Geçmişi</Text>
              {Object.entries(groupByYil(seciliUyeAidatlari)).map(([yil, aidatlar]) => (
                <View key={yil} style={styles.yilContainer}>
                  <Text style={styles.yilBaslik}>{yil}</Text>
                  <View style={styles.aylarGrid}>
                    {aylar.map(ay => {
                      const aidat = aidatlar.find(a => a.Ay.toString() === ay.value);
                      return (
                        <TouchableOpacity 
                          key={ay.value} 
                          style={styles.ayKutu}
                          onPress={() => aidat && handleAidatPress(aidat)}
                        >
                          <Text style={styles.ayLabel}>{ay.label}</Text>
                          {aidat ? (
                            <View style={[
                              styles.aidatDurum,
                              { backgroundColor: getDurumRengi(aidat.Durum) }
                            ]}>
                              <Text style={styles.aidatMiktar}>₺{aidat.Miktar}</Text>
                              <Text style={styles.aidatDurumText}>{aidat.Durum}</Text>
                            </View>
                          ) : (
                            <Text style={styles.noAidat}>-</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Form Alanları */}
          {yeniAidat.UyeId && (
            <View style={styles.formFields}>
              {/* Yıl */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Yıl:</Text>
                <TextInput
                  style={styles.input}
                  value={yeniAidat.Yil}
                  onChangeText={(value) => handleChange('Yil', value)}
                  keyboardType="numeric"
                  placeholder="YYYY"
                  maxLength={4}
                />
              </View>

              {/* Ay Seçimi */}
              {renderAySecimi()}

              {/* Miktar */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Miktar (₺):</Text>
                <TextInput
                  style={styles.input}
                  value={yeniAidat.Miktar}
                  onChangeText={(value) => handleChange('Miktar', value)}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              </View>

              {/* Durum */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Durum:</Text>
                <View style={styles.durumContainer}>
                  {['Ödendi', 'Ödenmedi'].map((durum) => (
                    <TouchableOpacity
                      key={durum}
                      style={[
                        styles.durumButton,
                        yeniAidat.Durum === durum && styles.selectedDurum
                      ]}
                      onPress={() => handleChange('Durum', durum)}
                    >
                      <Text style={[
                        styles.durumText,
                        yeniAidat.Durum === durum && styles.selectedDurumText
                      ]}>
                        {durum}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Kaydet Butonu */}
              <View style={styles.buttonContainer}>
                <Button 
                  title="Aidat Ekle" 
                  onPress={handleSubmit} 
                  color="#4CAF50"
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Güncelleme Modal */}
      {showUpdateModal && selectedAidat && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aidat Güncelle</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Yıl:</Text>
              <TextInput
                style={styles.input}
                value={selectedAidat.Yil.toString()}
                onChangeText={(value) => handleUpdateChange('Yil', value)}
                keyboardType="numeric"
              />
            </View>

            {/* Ay seçimi için dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Ay:</Text>
              <TouchableOpacity
                style={styles.aySelector}
                onPress={() => setShowUpdateAylar(!showUpdateAylar)}
              >
                <Text style={styles.aySelectorText}>
                  {selectedAidat.Ay ? aylar.find(a => a.value === selectedAidat.Ay.toString())?.label : 'Ay Seçiniz'}
                </Text>
              </TouchableOpacity>
              
              {showUpdateAylar && (
                <View style={styles.aylarDropdownContainer}>
                  <ScrollView 
                    style={styles.aylarScrollView}
                    nestedScrollEnabled={true}
                  >
                    {aylar.map(ay => (
                      <TouchableOpacity
                        key={ay.value}
                        style={[
                          styles.ayItem,
                          selectedAidat.Ay.toString() === ay.value && styles.selectedAy
                        ]}
                        onPress={() => {
                          handleUpdateChange('Ay', parseInt(ay.value));
                          setShowUpdateAylar(false);
                        }}
                      >
                        <Text style={[
                          styles.ayItemText,
                          selectedAidat.Ay.toString() === ay.value && styles.selectedAyText
                        ]}>
                          {ay.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Miktar:</Text>
              <TextInput
                style={styles.input}
                value={selectedAidat.Miktar.toString()}
                onChangeText={(value) => handleUpdateChange('Miktar', value)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Durum:</Text>
              <View style={styles.durumContainer}>
                {['Ödendi', 'Ödenmedi'].map((durum) => (
                  <TouchableOpacity
                    key={durum}
                    style={[
                      styles.durumButton,
                      selectedAidat.Durum === durum && styles.selectedDurum
                    ]}
                    onPress={() => handleUpdateChange('Durum', durum)}
                  >
                    <Text style={styles.durumText}>{durum}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.updateButton]}
                onPress={handleUpdate}
              >
                <Text style={styles.buttonText}>Güncelle</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]}
                onPress={() => handleDelete(selectedAidat.AidatId)}
              >
                <Text style={styles.buttonText}>Sil</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowUpdateModal(false)}
              >
                <Text style={styles.buttonText}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  uyeListContainer: {
    height: 300,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 20,
  },
  uyeListScrollContainer: {
    flex: 1,
  },
  uyeItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    alignItems: 'center',
  },
  selectedUye: {
    backgroundColor: '#e3f2fd',
  },
  uyeInfo: {
    flex: 1,
  },
  uyeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tcText: {
    fontSize: 14,
    color: '#666',
  },
  selectedText: {
    color: '#4CAF50',
    fontSize: 20,
    marginLeft: 10,
  },
  formFields: {
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  aySelector: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  aySelectorText: {
    fontSize: 16,
    color: '#333',
  },
  aylarDropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    zIndex: 1000,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  aylarScrollView: {
    maxHeight: 200,
  },
  ayItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ayItemText: {
    fontSize: 16,
  },
  selectedAy: {
    backgroundColor: '#e3f2fd',
  },
  selectedAyText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  durumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durumButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  selectedDurum: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  durumText: {
    textAlign: 'center',
    padding: 10,
  },
  selectedDurumText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 20,
  },
  aidatGecmisiContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  yilContainer: {
    marginBottom: 20,
  },
  yilBaslik: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#e0e0e0',
    padding: 5,
    borderRadius: 4,
  },
  aylarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ayKutu: {
    width: '31%', // 3 sütun için
    marginBottom: 10,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  ayLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  aidatDurum: {
    padding: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  aidatMiktar: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  aidatDurumText: {
    color: 'white',
    fontSize: 10,
  },
  noAidat: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  updateButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default AidatListeleme;

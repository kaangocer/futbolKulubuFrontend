import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, Button, Alert,Modal  } from 'react-native';
import axios from 'axios';
import { Dropdown } from 'react-native-element-dropdown';


const Formalar = () => {
  const [formalar, setFormalar] = useState([]);
  const [uyeler,  setUyeler] = useState([]);
  const [newForma, setNewForma] = useState({ 
    UyeId: null, 
    Boyut: '', 
    FormaDurum: 'Verildi' // Default değer
  });
const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [stokData, setStokData] = useState([]);
  const [stokGirdisi, setStokGirdisi] = useState({
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    'XS': 0,
    'S': 0,
    'M': 0,
    'L': 0,
    'XL': 0,
    'XXL': 0,
  });
  const boyutMapping = {
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "XS": 5,
    "S": 6,
    "M": 7,
    "L": 8,
    "XL": 9,
    "XXL": 10,
  };

  // API'den formaları ve stok verilerini al
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formalarRes, uyelerRes, stokRes] = await Promise.all([
          axios.get('http://192.168.1.21:3000/formalar'),
          axios.get('http://192.168.1.21:3000/uyeler'),
          axios.get('http://192.168.1.21:3000/formaStok')
        ]);

        setFormalar(formalarRes.data);
        setUyeler(uyelerRes.data);
        setStokData(stokRes.data.stoklar);
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Kullanıcıyı filtreleme
  const filteredFormalar = formalar.filter(item =>
    item.Ad.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.SoyAd.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.TcNo.includes(searchQuery)
  );

  // Seçilen kullanıcıyı ayarlama
  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const handleUpdate = async () => {
    // Önce kullanıcıya onay soralım
    Alert.alert(
      "Güncelleme",
      "Forma bilgilerini güncellemek istediğinizden emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel"
        },
        
        {
          text: "Güncelle",
          onPress: async () => {
            try {
              const boyutId = boyutMapping[selectedUser.Boyut];
              
              const response = await axios.put(`http://192.168.1.21:3000/formalar/${selectedUser.FormaId}`, {
                UyeId: selectedUser.UyeId,
                FormaTipId: 1, // Sabit olarak YAZLIK
                FormaDurum: selectedUser.FormaDurum,
                VerilmeTarihi: selectedUser.VerilmeTarihi,
                BoyutId: boyutId,
              });
          
              if (response.status === 200) {
                // Başarılı güncelleme sonrası listeyi yenile
                const formalarRes = await axios.get('http://192.168.1.21:3000/formalar');
                setFormalar(formalarRes.data);
                setSelectedUser(null); // Düzenleme formunu kapat
                Alert.alert('Başarılı', 'Forma bilgileri güncellendi');
              }
            } catch (error) {
              console.error('Güncelleme hatası:', error.response?.data || error.message);
              Alert.alert('Hata', 'Güncelleme sırasında bir hata oluştu');
            }
          }
        }
      ]
    );
  };
  

  //EKLE
  const handleAdd = async (data) => {
    try {
      // Önce üyenin mevcut bir forması var mı kontrol et
      const mevcutForma = formalar.find(forma => forma.UyeId === data.UyeId);
      
      if (mevcutForma) {
        Alert.alert(
          'Hata',
          'Bu üyeye ait zaten bir forma kaydı bulunmaktadır.',
          [
            {
              text: 'Tamam',
              onPress: () => {
                // Modal'ı kapat ve formu temizle
                setModalVisible(false);
                setNewForma({ UyeId: null, Boyut: '', FormaDurum: 'Verildi' });
              }
            }
          ]
        );
        return;
      }

      // Mevcut forma yoksa, yeni forma ekleme işlemine devam et
      const boyutId = boyutMapping[data.Boyut];
      
      const formaData = {
        UyeId: data.UyeId,
        FormaTipId: 1, // Sabit YAZLIK
        FormaDurum: data.FormaDurum || 'Verildi',
        VerilmeTarihi: new Date().toISOString(),
        BoyutId: boyutId
      };

      const response = await axios.post('http://192.168.1.21:3000/formalar', formaData);

      if (response.status === 200 || response.status === 201) {
        const formalarRes = await axios.get('http://192.168.1.21:3000/formalar');
        setFormalar(formalarRes.data);
        Alert.alert('Başarılı', 'Forma başarıyla eklendi');
        // Modal'ı kapat ve formu temizle
        setModalVisible(false);
        setNewForma({ UyeId: null, Boyut: '', FormaDurum: 'Verildi' });
      }
    } catch (error) {
      console.error('Hata:', error);
      Alert.alert('Hata', 'Forma eklenirken bir hata oluştu');
    }
  };
  












//stok güncelleme
  const handleUpdateUser = async () => {
    const stokDataList = Object.keys(stokGirdisi).map((boyut) => {
        const boyutData = stokGirdisi[boyut];
        
        // Yalnızca null olmayan verileri alın
        const ToplamAdet = boyutData?.ToplamAdet !== null && boyutData?.ToplamAdet !== undefined ? boyutData?.ToplamAdet : null;
        const TeslimEdilen = boyutData?.TeslimEdilen !== null && boyutData?.TeslimEdilen !== undefined ? boyutData?.TeslimEdilen : null;
        const KalanAdet = ToplamAdet !== null && TeslimEdilen !== null ? ToplamAdet - TeslimEdilen : null;

        // Eğer null olmayan değer varsa, bunları stokDataList'e ekle
        return {
            FormaTipi: 'YAZLIK', // Sabit değer
            Boyut: boyut, // Kutunun üstünde yazan değer
            ToplamAdet,
            TeslimEdilen,
            KalanAdet
        };
    }).filter(stok => stok.ToplamAdet !== null || stok.TeslimEdilen !== null || stok.KalanAdet !== null); // Null olmayan verileri filtrele

    // Kalan adetlerin kontrolü
    const kalanAdetKontrol = stokDataList.every((stok) => stok.KalanAdet >= 0);
    if (!kalanAdetKontrol) {
        alert('Kalan adet 0\'ın altına düşemez. Güncelleme yapılamaz.');
        return;
    }

    // Kullanıcıdan güncelleme için onay al
    Alert.alert(
        "Güncelleme", 
        "Güncellensin mi?", 
        [
            {
                text: "Hayır",
                onPress: () => console.log("Güncelleme iptal edildi"),
                style: "cancel"
            },
            {
                text: "Evet", 
                onPress: async () => {
                    try {
                        // Stok güncelleme API isteği
                        const response = await fetch('http://192.168.1.21:3000/formaStok/guncelle', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(stokDataList),
                        });

                        if (!response.ok) {
                            throw new Error('Güncelleme sırasında hata oluştu');
                        }

                        const data = await response.json();
                       

                        // API'den yeni stok verilerini al
                        const fetchStokData = async () => {
                            try {
                                const response = await fetch('http://192.168.1.21:3000/formaStok');
                                const data = await response.json();
                                setStokData(data.stoklar); // stokData state'ini güncelle
                            } catch (error) {
                                console.error('Stok verileri alınırken hata oluştu:', error);
                            }
                        };

                        fetchStokData();
                        alert('Stok başarıyla güncellendi!');
                    } catch (error) {
                        console.error('Hata:', error);
                        alert('Güncelleme sırasında bir hata oluştu.');
                    }
                }
            }
        ]
    );
};





  

  // Stok özetini hesaplama
const calculateStokSummary = () => {
  if (!Array.isArray(stokData)) {
    console.error('stokData dizisi bekleniyor, ancak veri:', stokData);
    return { ToplamAdet: 0, TeslimEdilen: 0, KalanAdet: 0, stokSummary: {} };
  }

  const ToplamAdet = Object.values(stokGirdisi).reduce((acc, cur) => acc + cur, 0);

  // Stok verilerini boyut bazında grupla
  const stokSummary = stokData.reduce((acc, stok) => {
    const key = `${stok.FormaTipId}-${stok.Boyut}`; // FormaTipId ve Boyut'u birleştirerek anahtar oluştur
    if (!acc[key]) {
      acc[key] = stok.KalanAdet;
    } else {
      acc[key] += stok.KalanAdet;
    }
    return acc;
  }, {});

  const TeslimEdilen = formalar.filter(item =>
    ['1', '2', '3', '4', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(item.Boyut) &&
    item.FormaDurum === 'Verildi'
  ).length;

  // Kalan adet, toplam adet - teslim edilen adet olarak hesaplanır
  const KalanAdet = ToplamAdet - TeslimEdilen;

  // Boyut bazında kalan adetler (stokSummary)
  const formattedStokSummary = {};
  Object.keys(stokSummary).forEach((key) => {
    const [formaTipId,boyut] = key.split('-');
    formattedStokSummary[boyut] = stokSummary[key];
  });

  return { ToplamAdet, TeslimEdilen, KalanAdet, stokSummary: formattedStokSummary };
};

// Silme işlemi için yeni fonksiyon ekleyelim
const handleDelete = async (formaId) => {
  // Önce kullanıcıya onay soralım
  Alert.alert(
    "Forma Sil",
    "Bu formayı silmek istediğinizden emin misiniz?",
    [
      {
        text: "İptal",
        style: "cancel"
      },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await axios.delete(`http://192.168.1.21:3000/formalar/${formaId}`);
            
            if (response.status === 200) {
              // Başarılı silme işlemi sonrası listeyi güncelle
              const formalarRes = await axios.get('http://192.168.1.21:3000/formalar');
              setFormalar(formalarRes.data);
              setSelectedUser(null); // Düzenleme formunu kapat
              Alert.alert('Başarılı', 'Forma başarıyla silindi');
            }
          } catch (error) {
            console.error('Silme hatası:', error);
            Alert.alert('Hata', 'Forma silinirken bir hata oluştu');
          }
        }
      }
    ]
  );
};

// Formaları listele
const renderItem = ({ item }) => (
  <>
    <TouchableOpacity style={styles.item} onPress={() => handleSelectUser(item)}>
      <Text style={styles.uyelikBilgileri}>
        {item.Ad} {item.SoyAd} - TC: {item.TcNo}
      </Text>
      <Text style={styles.boyut}>Boyut: {item.Boyut}</Text>
    </TouchableOpacity>

    {/* Seçili kullanıcının altında form gösterimi */}
    {selectedUser && selectedUser.FormaId === item.FormaId && (
      <View style={styles.editFormContainer}>
        <Text style={styles.formTitle}>Kullanıcı Bilgilerini Düzenle</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Ad"
          value={selectedUser.Ad || ''}
          editable={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Soyad"
          value={selectedUser.SoyAd || ''}
          editable={false}
        />
        <TextInput
          style={styles.input}
          placeholder="TC No"
          value={selectedUser.TcNo || ''}
          editable={false}
        />

        {/* Forma Boyutu */}
        <Text style={styles.label}>Forma Boyutu</Text>
        <View style={styles.boyutContainer}>
          {['1', '2', '3', '4', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map((boyut) => (
            <TouchableOpacity
              key={boyut}
              style={[
                styles.boyutButton,
                selectedUser.Boyut === boyut && styles.selectedBoyut,
              ]}
              onPress={() => setSelectedUser({ ...selectedUser, Boyut: boyut })}
            >
              <Text style={styles.boyutButtonText}>{boyut}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Forma Tipi */}
        <Text style={styles.label}>Forma Tipi</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value="YAZLIK"
          editable={false}
        />

        {/* Forma Durumu Dropdown */}
        <Text style={styles.label}>Forma Durumu</Text>
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          data={[
            { label: 'Verildi', value: 'Verildi' },
            { label: 'Odendi', value: 'Odendi' }
          ]}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Forma Durumu Seçiniz"
          value={selectedUser.FormaDurum}
          onChange={item => {
            setSelectedUser({ ...selectedUser, FormaDurum: item.value });
          }}
        />

        {/* Verilme Tarihi */}
        <Text style={styles.label}>Verilme Tarihi</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={selectedUser.VerilmeTarihi || ''}
          onChangeText={(text) => setSelectedUser({ ...selectedUser, VerilmeTarihi: text })}
        />

        {/* Buton Container */}
        <View style={styles.modalButtonContainer}>
          <TouchableOpacity
            style={[styles.modalButton, styles.saveButton]}
            onPress={() => handleUpdate(selectedUser)}
          >
            <Text style={styles.modalButtonText}>Güncelle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setSelectedUser(null)}
          >
            <Text style={styles.modalButtonText}>İptal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalButton, styles.deleteButton]}
            onPress={() => handleDelete(selectedUser.FormaId)}
          >
            <Text style={[styles.modalButtonText, styles.deleteButtonText]}>Sil</Text>
          </TouchableOpacity>
        </View>
      </View>
    )}
  </>
);

// Yükleniyor göstergesi
if (loading) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
}

const { stokSummary } = calculateStokSummary();

return (
  <FlatList
    ListHeaderComponent={
      <>
        <Text style={styles.stokInfoText}>FORMA STOK BİLGİSİ</Text>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Stok Bilgisi</Text>
          <View style={styles.stokGrid}>
            {['1', '2', '3', '4', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map((boyut) => (
              <View key={boyut} style={styles.stokCard}>
                <Text style={styles.boyutLabel}>{boyut}</Text>
                <View style={styles.stokInputGroup}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Toplam</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="0"
                      value={stokGirdisi[boyut]?.ToplamAdet !== undefined ? 
                        stokGirdisi[boyut].ToplamAdet.toString() : ''}
                      onChangeText={(text) => {
                        const newValue = parseInt(text) || 0;
                        const updatedStok = {
                          ...stokGirdisi,
                          [boyut]: {
                            ...stokGirdisi[boyut],
                            ToplamAdet: newValue >= 0 ? newValue : 0,
                          },
                        };
                        setStokGirdisi(updatedStok);
                      }}
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Teslim</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="0"
                      value={stokGirdisi[boyut]?.TeslimEdilen !== undefined ? 
                        stokGirdisi[boyut].TeslimEdilen.toString() : ''}
                      onChangeText={(text) => {
                        const newValue = parseInt(text) || 0;
                        const updatedStok = {
                          ...stokGirdisi,
                          [boyut]: {
                            ...stokGirdisi[boyut],
                            TeslimEdilen: newValue >= 0 ? newValue : 0,
                          },
                        };
                        setStokGirdisi(updatedStok);
                      }}
                    />
                  </View>
                </View>
                <Text style={styles.kalanText}>
                  Kalan: {stokSummary[boyut] || 0}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="Stok Güncelle"
              onPress={handleUpdateUser}
            />
          </View>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Kullanıcı Ara (Ad, Soyad, TC No)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Text style={styles.formTitle}>Kullanıcı Bilgilerini Düzenle</Text>

          {/* Yeni Forma Ekle butonu */}
          <Button
            title="Yeni Forma Ekle"
            onPress={() => setModalVisible(true)}
          />

          {/* Ekleme Modal */}
          {modalVisible && (
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.formTitle}>Yeni Forma Ekle</Text>
                  
                  {/* Üye Seçimi */}
                  <Text style={styles.modalTitle}>Üye Seçimi</Text>
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    searchPlaceholder="Ara..."
                    search
                    searchable
                    data={uyeler
                      .filter(uye => uye.Ad && uye.SoyAd && uye.TcNo) // Filter out entries with missing data
                      .map(uye => ({
                        label: `${uye.Ad} ${uye.SoyAd} - TC: ${uye.TcNo}`,
                        value: uye.UyeId
                      }))}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder="Üye Seçiniz"
                    value={newForma.UyeId}
                    onChange={item => {
                      setNewForma({
                        ...newForma,
                        UyeId: item.value
                      });
                    }}
                  />
                  
                  {/* Forma Durumu Dropdown */}
                  <Text style={styles.label}>Forma Durumu</Text>
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    data={[
                      { label: 'Verildi', value: 'Verildi' },
                      { label: 'Odendi', value: 'Odendi' }
                    ]}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder="Forma Durumu Seçiniz"
                    value={newForma.FormaDurum}
                    onChange={item => {
                      setNewForma({
                        ...newForma,
                        FormaDurum: item.value
                      });
                    }}
                  />
                  
                  {/* Forma Boyutu */}
                  <Text style={styles.label}>Forma Boyutu</Text>
                  <View style={styles.boyutContainer}>
                    {['1', '2', '3', '4', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map((boyut) => (
                      <TouchableOpacity
                        key={boyut}
                        style={[
                          styles.boyutButton,
                          newForma.Boyut === boyut && styles.selectedBoyut,
                        ]}
                        onPress={() => setNewForma({ ...newForma, Boyut: boyut })}
                      >
                        <Text style={styles.boyutButtonText}>{boyut}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Butonlar */}
                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.saveButton]}
                      onPress={async () => {
                        if (!newForma.UyeId || !newForma.Boyut) {
                          Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun');
                          return;
                        }
                        try {
                          await handleAdd(newForma);
                          setModalVisible(false);
                          setNewForma({ UyeId: null, Boyut: '', FormaDurum: 'Verildi' });
                        } catch (error) {
                          console.error('Hata:', error);
                        }
                      }}
                    >
                      <Text style={styles.modalButtonText}>Kaydet</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => {
                        setModalVisible(false);
                        setNewForma({ UyeId: null, Boyut: '', FormaDurum: 'Verildi' });
                      }}
                    >
                      <Text style={styles.modalButtonText}>İptal</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </>
    }
    data={filteredFormalar}
    renderItem={renderItem}
    keyExtractor={item => item.FormaId.toString()}
  />
);
}







const styles = StyleSheet.create({
  item: {
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  uyelikBilgileri: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  boyut: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    marginHorizontal: 10,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 15,
    textAlign: 'center',
  },
  
  



  bottomInfoContainer: {
    marginTop: 30, // Üst kısımdan biraz daha aşağıya yerleştirelim
    padding: 10,
    backgroundColor: '#e0e0e0', // Arka plan rengi
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  stokInfoText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#343a40',
    marginVertical: 15,
    textAlign: 'center',
  },




  inputRow: {
    width: '48%',  // İki kutu arasında boşluk bırakarak hizalama
    marginVertical: 10,
    alignItems: 'center', // Yatayda ortalamak için
  },








  
  
  
  stokInfoContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputWrapper: {
    width: '48%', // Küçük kutular yapmak için genişlik
    marginVertical: 5, // Yalnızca dikeyde boşluk bırakmak için
    marginHorizontal: '1%', // Yanlarda boşluk bırakmak için
  },
  stokInputContainer: {
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 12,
    fontSize: 15,
    color: '#495057',
  },










  boyutContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
  boyutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 4,
    borderRadius: 6,
    backgroundColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  boyutButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  selectedBoyut: {
    backgroundColor: '#4dabf7',
    borderColor: '#339af0',
  },




  
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },




  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },












  
  dropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 15,
  },
  placeholderStyle: {
    fontSize: 15,
    color: '#adb5bd',
  },
  selectedTextStyle: {
    fontSize: 15,
    color: '#495057',
    fontWeight: '500',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
  },
  editFormContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    marginHorizontal: 10,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  stokGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  stokCard: {
    width: '48%',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },

  boyutLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
    marginBottom: 8,
  },

  stokInputGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  inputContainer: {
    flex: 1,
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 4,
  },

  kalanText: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },

  buttonContainer: {
    marginTop: 15,
    paddingHorizontal: 20,
  },

  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4dabf7',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
  },
  deleteButtonText: {
    color: '#ffffff',
  },
});














export default Formalar;

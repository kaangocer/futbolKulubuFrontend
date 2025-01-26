import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, TextInput, Button, Modal,TouchableOpacity } from 'react-native';
import { Table, Row } from 'react-native-table-component';
import RNPickerSelect from 'react-native-picker-select';
import styles from './styles';
import { Alert } from 'react-native';

export default function Gruplar({ }) {
  const [uyeler, setUyeler] = useState([]);
  const [filteredUyeler, setFilteredUyeler] = useState([]);
  const [search, setSearch] = useState('');
  const [gruplar, setGruplar] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Modal için durum
  const [modalVisible, setModalVisible] = useState(false);
  const [grupAdi, setGrupAdi] = useState('');
  const [grupTipi, setGrupTipi] = useState('');
  const [selectedGroupToUpdate, setSelectedGroupToUpdate] = useState(null);



  
  const fetchUyeler = async () => {
    try {
      const response = await fetch('http://192.168.1.21:3000/uyeler');
      const data = await response.json();
      setUyeler(data);
      setFilteredUyeler(data);
    } catch (error) {
      console.error('Üyeler alınırken hata oluştu:', error);
    }
  };

  const fetchGruplar = async () => {
    try {
      const response = await fetch('http://192.168.1.21:3000/gruplar');
      const data = await response.json();
      setGruplar(data);
    } catch (error) {
      console.error('Gruplar alınırken hata oluştu:', error);
    }
  };

  const filterUyeler = (text) => {
    setSearch(text);
    const searchText = text.toLowerCase().trim();
    
    const filtered = uyeler.filter((item) => {
      const matchesSearch = Object.values(item)
        .filter(value => value !== null && value !== undefined)
        .some(value => value.toString().toLowerCase().includes(searchText));
      
      return selectedGroup 
        ? matchesSearch && item.GrupId === selectedGroup
        : matchesSearch;
    });
    
    setFilteredUyeler(filtered);
  };

  const handleGroupFilter = (group) => {
    setSelectedGroup(group);
    if (group) {
      const filtered = uyeler.filter((item) => item.GrupId === group);
      setFilteredUyeler(filtered);
    } else {
      setFilteredUyeler(uyeler);
    }
  };

  // Yeni grup ekleme
  const handleAddGroup = async () => {
    if (grupAdi && grupTipi) {
      try {
        const response = await fetch('http://192.168.1.21:3000/gruplar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            GrupAdi: grupAdi,
            GrupTipi: grupTipi,
          }),
        });
        if (response.ok) {
          alert('Yeni grup başarıyla eklendi');
          setModalVisible(false);
          fetchGruplar(); // Gruplar listesini tekrar al
        } else {
          alert('Grup eklenirken bir hata oluştu');
        }
      } catch (error) {
        console.error('Grup eklenirken hata oluştu:', error);
        alert('Grup eklenirken bir hata oluştu');
      }
    } else {
      alert('Grup adı ve tipi girilmelidir');
    }
  };

  // Grup güncelleme
  const handleUpdateGroup = async () => {
    if (grupAdi && grupTipi) {
      try {
        const response = await fetch(`http://192.168.1.21:3000/gruplar/${selectedGroupToUpdate}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            GrupAdi: grupAdi,
            GrupTipi: grupTipi,
          }),
        });
        if (response.ok) {
          alert('Grup başarıyla güncellendi');
          setModalVisible(false);
          fetchGruplar(); // Gruplar listesini tekrar al
        } else {
          alert('Grup güncellenirken bir hata oluştu');
        }
      } catch (error) {
        console.error('Grup güncellenirken hata oluştu:', error);
        alert('Grup güncellenirken bir hata oluştu');
      }
    } else {
      alert('Grup adı ve tipi girilmelidir');
    }
  };

  // Grup silme
  const handleDeleteGroup = async (groupId) => {
    Alert.alert(
      'Grup Sil',
      'Bu grubu silmek istediğinizden emin misiniz?',
      [
        {
          text: 'Hayır',
          onPress: () => console.log('Grup silme iptal edildi'),
          style: 'cancel',
        },
        {
          text: 'Evet',
          onPress: async () => {
            try {
              const response = await fetch(`http://192.168.1.21:3000/gruplar/${groupId}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                alert('Grup başarıyla silindi');
                fetchGruplar(); // Gruplar listesini tekrar al
              } else {
                alert('Grup silinirken bir hata oluştu');
              }
            } catch (error) {
              console.error('Grup silinirken hata oluştu:', error);
              alert('Grup silinirken bir hata oluştu');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  useEffect(() => {
    fetchUyeler();
    fetchGruplar();
  }, []);


  const tableData = filteredUyeler.map((item, index) => [
    index + 1,
    item.Ad,
    item.SoyAd,
    item.TelNo,
    item.DogumYili,
    item.AnneAdi,
    item.BabaAdi,
    item.AnneTelNo,
    item.BabaTelNo,
    item.TcNo,
    item.Adres,
    item.KayitTarihi
  ]);

  const tableHead = ['#', 'Ad', 'Soyad', 'TelNo', 'Doğum Yılı', 'Anne Adı', 'Baba Adı', 'Anne Tel No', 'Baba Tel No', 'Tc No', 'Adres', 'Kayıt Tarihi'];
  const columnWidths = [40, 120, 120, 120, 100, 150, 150, 150, 150, 150, 200, 150];

  return (
    <View style={styles.container}>
      {/* Grup Seçimi */}
      <View style={styles.groupContainer}>
        <RNPickerSelect
          onValueChange={(value) => handleGroupFilter(value)}
          items={[{ label: 'Tüm Gruplar', value: null }, ...gruplar.map(group => ({ label: group.GrupAdi, value: group.GrupId }))]}
          style={{
            inputAndroid: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12, borderWidth: 2, borderColor: '#dee2e6', color: '#212529', fontSize: 18 },
            inputIOS: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12, borderWidth: 2, borderColor: '#dee2e6', color: '#212529', fontSize: 18 },
            placeholder: { color: '#0d6efd', fontSize: 16 },
          }}
        />
      </View>

      {/* Arama Barı */}
      <TextInput
        style={[styles.searchInput, { marginBottom: 10 }]}
        placeholder="Kişi Ara..."
        value={search}
        onChangeText={filterUyeler}
      />

      {/* Grup Ekle Butonu */}
      <TouchableOpacity 
        style={{
          backgroundColor: '#198754',
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 8,
          marginBottom: 15,
          alignItems: 'center'
        }}
        onPress={() => {
          setModalVisible(true);
          setGrupAdi('');
          setGrupTipi('');
          setSelectedGroupToUpdate(null);
        }}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Grup Ekle</Text>
      </TouchableOpacity>

      {/* Grup Ekleme veya Güncelleme Modal'ı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedGroupToUpdate ? 'Grup Güncelle' : 'Yeni Grup Ekle'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Grup Adı"
              value={grupAdi}
              onChangeText={setGrupAdi}
            />
            <TextInput
              style={styles.input}
              placeholder="Grup Tipi"
              value={grupTipi}
              onChangeText={setGrupTipi}
            />
            <Button
              title={selectedGroupToUpdate ? 'Güncelle' : 'Ekle'}
              onPress={selectedGroupToUpdate ? handleUpdateGroup : handleAddGroup}
            />
            <Button title="İptal" onPress={() => {
              setModalVisible(false);
              setSelectedGroupToUpdate(null);  // Modal kapatıldığında güncelleme için seçili grup sıfırlanır.
            }} />
          </View>
        </View>
      </Modal>

      {/* Ana ScrollView: Tüm sayfayı kapsar */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        {selectedGroup ? (
          <View style={styles.tableWrapper}>
            <ScrollView horizontal={true}>
              <Table borderStyle={{ borderWidth: 1, borderColor: '#000000' }}>
                <Row data={tableHead} style={styles.tableHeader} textStyle={styles.tableHeaderText} widthArr={columnWidths} />
                {tableData.map((rowData, index) => (
                  <Row
                    key={index}
                    data={rowData}
                    style={{ backgroundColor: index % 2 === 0 ? '#f5f5f5' : '#e0e0e0' }}
                    textStyle={styles.tableCell}
                    widthArr={columnWidths}
                  />
                ))}
              </Table>
            </ScrollView>
          </View>
        ) : (
          gruplar.map((group) => {
            const groupUyeler = filteredUyeler.filter((item) => item.GrupId === group.GrupId);
            const groupTableData = groupUyeler.map((item, index) => [
              index + 1,
              item.Ad,
              item.SoyAd,
              item.TelNo,
              item.DogumYili,
              item.AnneAdi,
              item.BabaAdi,
              item.AnneTelNo,
              item.BabaTelNo,
              item.TcNo,
              item.Adres,
              item.KayitTarihi,
            ]);
            return (
              <View key={group.GrupId} style={[styles.tableWrapper, { marginTop: 20 }]}>
                <View style={{
                  backgroundColor: '#0d6efd',
                  padding: 15,
                  borderRadius: 10,
                  marginBottom: 15,
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}>
                  <Text style={{
                    fontSize: 22,
                    fontWeight: 'bold',
                    color: 'white',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}>{group.GrupAdi}</Text>
                  <Text style={{
                    fontSize: 16,
                    color: '#e6e6e6',
                    textAlign: 'center',
                    marginTop: 5,
                  }}>{group.GrupTipi}</Text>
                  
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    marginTop: 10,
                    gap: 10,
                  }}>
                    <TouchableOpacity 
                      style={{
                        backgroundColor: '#ffc107',
                        paddingVertical: 8,
                        paddingHorizontal: 15,
                        borderRadius: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                      onPress={() => {
                        setSelectedGroupToUpdate(group.GrupId);
                        setGrupAdi(group.GrupAdi);
                        setGrupTipi(group.GrupTipi);
                        setModalVisible(true);
                      }}
                    >
                      <Text style={{ color: '#000', fontSize: 14, fontWeight: '600' }}>
                        Güncelle
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{
                        backgroundColor: '#dc3545',
                        paddingVertical: 8,
                        paddingHorizontal: 15,
                        borderRadius: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                      onPress={() => handleDeleteGroup(group.GrupId)}
                    >
                      <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                        Sil
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView horizontal={true}>
                  <Table borderStyle={{ borderWidth: 1, borderColor: '#000000' }}>
                    <Row data={tableHead} style={styles.tableHeader} textStyle={styles.tableHeaderText} widthArr={columnWidths} />
                    {groupTableData.map((rowData, index) => (
                      <Row
                        key={index}
                        data={rowData}
                        style={{ backgroundColor: index % 2 === 0 ? '#f5f5f5' : '#e0e0e0' }}
                        textStyle={styles.tableCell}
                        widthArr={columnWidths}
                      />
                    ))}
                  </Table>
                </ScrollView>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

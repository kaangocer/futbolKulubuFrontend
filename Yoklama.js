import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/tr';  // Türkçe tarih formatı için

const Yoklama = () => {
  const [groupedUyeler, setGroupedUyeler] = useState({});
  const [yoklamaDurumu, setYoklamaDurumu] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedYoklamalar, setSelectedYoklamalar] = useState({});
  const [weekends, setWeekends] = useState([]);
  const [uyeler, setUyeler] = useState([]);

  // useRef ile son seçilen tarihi tut
  const lastSelectedDate = useRef(null);

  useEffect(() => {
    fetchUyelerVeGruplar();
    generateWeekends();
  }, []);

  

  useEffect(() => {
    if (selectedDate) {
      fetchYoklamalar(moment(selectedDate).format('YYYY-MM-DD'));
    }
  }, [selectedDate]);

  // Ay içindeki haftasonlarını oluştur
  const generateWeekends = () => {
    const startOfMonth = moment().startOf('month');
    const endOfMonth = moment().endOf('month');
    const weekendDays = [];

    let currentDay = startOfMonth.clone();
    
    while (currentDay.isSameOrBefore(endOfMonth)) {
      if (currentDay.day() === 6 || currentDay.day() === 0) { // 6 = Cumartesi, 0 = Pazar
        weekendDays.push({
          date: currentDay.clone(), // Tarihi clone'layarak yeni bir moment objesi oluştur
          weekNumber: Math.ceil(currentDay.date() / 7),
          dayName: currentDay.locale('tr').format('dddd'),
          formattedDate: currentDay.format('DD-MM-YYYY')
        });
      }
      currentDay.add(1, 'day');
    }

    setWeekends(weekendDays);
    if (weekendDays.length > 0) {
      handleDateSelect(weekendDays[0]);
    }
  };

  const fetchUyelerVeGruplar = async () => {
    try {
      const gruplarResponse = await axios.get('http://192.168.1.21:3000/gruplar');
      const uyelerResponse = await axios.get('http://192.168.1.21:3000/uyeler');
      
      const grouped = gruplarResponse.data.reduce((acc, grup) => {
        acc[grup.GrupId] = {
          grupAdi: grup.GrupAdi,
          uyeler: uyelerResponse.data.filter(uye => uye.GrupId === grup.GrupId)
        };
        return acc;
      }, {});

      setGroupedUyeler(grouped);
      setUyeler(uyelerResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      setLoading(false);
    }
  };

  const fetchYoklamalar = async (tarih) => {
    try {
      const response = await axios.get(`http://192.168.1.21:3000/yoklamalar?tarih=${tarih}`);
      if (response.data && response.data.length > 0) {
        // Yoklamalar varsa, bunları state'e kaydet
        const yoklamalar = response.data.reduce((acc, yoklama) => {
          acc[yoklama.UyeId] = yoklama;
          return acc;
        }, {});
        setYoklamaDurumu(yoklamalar);
      } else {
        // Yoklama yoksa state'i sıfırla
        setYoklamaDurumu({});
      }
    } catch (error) {
      console.error('Yoklamalar yüklenirken hata:', error);
      setYoklamaDurumu({});
    }
  };

  const handleYoklamaSelect = (uye, durum) => {
    setSelectedYoklamalar(prev => {
      const newState = { ...prev };
      
      // Eğer aynı durum seçiliyse, seçimi kaldır
      if (newState[uye.UyeId] === durum) {
        delete newState[uye.UyeId];
      } else {
        // Yeni durumu ata
        newState[uye.UyeId] = durum;
      }
      
      return newState;
    });
  };

  const handleDateSelect = async (weekend) => {
    try {
      setLoading(true); // Yükleme durumunu aktif et
      setSelectedYoklamalar({}); // Seçili yoklamaları temizle
      
      // Seçilen tarihi DD-MM-YYYY formatına çevir
      const selectedDateStr = moment(weekend.date).format('DD-MM-YYYY');
      setSelectedDate(weekend.date); // Seçilen tarihi state'e kaydet
      
      // Seçilen tarihe ait yoklamaları API'den getir
      const response = await axios.get(`http://192.168.1.21:3000/yoklamalar/tarih/${selectedDateStr}`);
      
      // Mevcut yoklama durumunu temizle
      setYoklamaDurumu({});
      
      // State güncellemesi için kısa bir gecikme
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // API'den gelen verileri işle ve state'e aktar
      if (response.data && Array.isArray(response.data)) {
        const yeniYoklamalar = {};
        response.data.forEach(yoklama => {
          // Her yoklama kaydını UyeId'ye göre objede sakla
          yeniYoklamalar[yoklama.UyeId] = {
            ...yoklama,
            YoklamaDurum: yoklama.YoklamaDurum
          };
        });
        
        setYoklamaDurumu(yeniYoklamalar); // İşlenmiş verileri state'e aktar
      }
      
      setLoading(false); // Yükleme durumunu kapat
    } catch (error) {
      console.error('API Hatası:', error);
      setYoklamaDurumu({}); // Hata durumunda state'i temizle
      setLoading(false); // Hata durumunda yüklemeyi kapat
    }
  };

  // Gereksiz useEffect'leri kaldır
  useEffect(() => {
    fetchUyelerVeGruplar();
    generateWeekends();
  }, []);

  // renderYoklamaButtons fonksiyonunu güncelle
  const renderYoklamaButtons = useCallback((uye) => {
    // Üyenin mevcut yoklama durumunu ve seçili durumunu al
    const mevcutYoklama = yoklamaDurumu[uye.UyeId];
    const secilenDurum = selectedYoklamalar[uye.UyeId];
    
    // Aktif durumu belirle (seçili durum varsa onu, yoksa mevcut durumu kullan)
    const aktifDurum = secilenDurum || mevcutYoklama?.YoklamaDurum;
    
    return (
      <View style={styles.yoklamaButtons}>
        {/* Geldi butonu */}
        <TouchableOpacity
          style={[
            styles.yoklamaButton,
            aktifDurum === 'Geldi' && styles.selectedGeldi // Seçili ise yeşil stil uygula
          ]}
          onPress={() => handleYoklamaSelect(uye, 'Geldi')}
        >
          <Icon 
            name="check-circle" 
            size={24} 
            color={aktifDurum === 'Geldi' ? '#4caf50' : '#e0e0e0'} 
          />
        </TouchableOpacity>

        {/* Gelmedi butonu */}
        <TouchableOpacity
          style={[
            styles.yoklamaButton,
            aktifDurum === 'Gelmedi' && styles.selectedGelmedi // Seçili ise kırmızı stil uygula
          ]}
          onPress={() => handleYoklamaSelect(uye, 'Gelmedi')}
        >
          <Icon 
            name="cancel" 
            size={24} 
            color={aktifDurum === 'Gelmedi' ? '#f44336' : '#e0e0e0'} 
          />
        </TouchableOpacity>
      </View>
    );
  }, [yoklamaDurumu, selectedYoklamalar]); // Bağımlılıklar: yoklama durumu ve seçili yoklamalar değişince yeniden render et

  const handleYoklamaUpdate = async (grupId) => {
    try {
      // Seçili gruptaki üyelerin yoklamalarını filtrele
      const grupUyeleri = Object.entries(selectedYoklamalar).filter(([uyeId]) => {
        const uye = uyeler.find(u => u.UyeId === parseInt(uyeId));
        return uye && uye.GrupId === parseInt(grupId);
      });

      // Seçili yoklama yoksa uyarı ver
      if (grupUyeleri.length === 0) {
        Alert.alert("Uyarı", "Lütfen en az bir yoklama durumu seçin!");
        return;
      }

      setLoading(true);
      const formattedDate = moment(selectedDate).format('YYYY-MM-DD');

      // Tüm güncellemeleri bir dizide topla
      const updatePromises = grupUyeleri.map(async ([uyeId, durum]) => {
        const mevcutYoklama = yoklamaDurumu[uyeId];
        const yoklamaData = {
          UyeId: parseInt(uyeId),
          Tarih: formattedDate,
          YoklamaDurum: durum
        };

        // Mevcut kayıt varsa güncelle, yoksa yeni kayıt oluştur
        if (mevcutYoklama?.YoklamaId) {
          return axios.put(
            `http://192.168.1.21:3000/yoklamalar/${mevcutYoklama.YoklamaId}`, 
            yoklamaData
          );
        } else {
          return axios.post('http://192.168.1.21:3000/yoklamalar', yoklamaData);
        }
      });

      // Tüm güncellemeleri bekle
      await Promise.all(updatePromises);

      // Güncel verileri yükle
      const selectedDateStr = moment(selectedDate).format('DD-MM-YYYY');
      const response = await axios.get(`http://192.168.1.21:3000/yoklamalar/tarih/${selectedDateStr}`);
      
      // Yeni verileri state'e aktar
      const yeniYoklamalar = response.data.reduce((acc, yoklama) => {
        acc[yoklama.UyeId] = yoklama;
        return acc;
      }, {});
      
      // State'leri güncelle
      setYoklamaDurumu(yeniYoklamalar);
      setSelectedYoklamalar({});
      setLoading(false);
      Alert.alert("Başarılı", "Yoklamalar kaydedildi!");

    } catch (error) {
      setLoading(false);
      console.error('Yoklama kaydedilirken hata:', error);
      Alert.alert("Hata", "Yoklama kaydedilirken bir hata oluştu.");
    }
  };

  // Tarih seçimi butonlarını güncelleyelim
  const renderWeekendButtons = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekendList}>
        {weekends.map((weekend, index) => {
          const isSelected = selectedDate && 
            moment(selectedDate).format('DD-MM-YYYY') === moment(weekend.date).format('DD-MM-YYYY');
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.weekendItem,
                isSelected && styles.selectedWeekend
              ]}
              onPress={() => handleDateSelect(weekend)}
            >
              <Text style={styles.weekNumber}>{weekend.weekNumber}. Hafta</Text>
              <Text style={styles.dayName}>{weekend.dayName}</Text>
              <Text style={styles.dateText}>
                {moment(weekend.date).format('D MMMM')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  // Component mount olduğunda
  useEffect(() => {
    fetchUyelerVeGruplar();
    generateWeekends();
    
    // Component unmount olduğunda state'leri temizle
    return () => {
      setYoklamaDurumu({});
      setSelectedYoklamalar({});
      setSelectedDate(null);
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderWeekendButtons()}

      <ScrollView>
        {Object.entries(groupedUyeler).map(([grupId, grupData]) => (
          <View key={grupId} style={styles.grupContainer}>
            <Text style={styles.grupBaslik}>{grupData.grupAdi}</Text>
            {grupData.uyeler.map((uye, index) => (
              <View key={uye.UyeId} style={styles.uyeRow}>
                <View style={styles.uyeInfo}>
                  <Text style={styles.uyeNumara}>{index + 1}.</Text>
                  <View>
                    <Text style={styles.uyeAd}>{`${uye.Ad} ${uye.SoyAd}`}</Text>
                    <Text style={styles.uyeTc}>{uye.TcNo}</Text>
                  </View>
                </View>
                {renderYoklamaButtons(uye)}
              </View>
            ))}
            {/* Her grubun altına güncelleme butonu */}
            {Object.keys(selectedYoklamalar).length > 0 && (
              <TouchableOpacity 
                style={styles.updateButton}
                onPress={() => handleYoklamaUpdate(grupId)}
              >
                <Text style={styles.updateButtonText}>Grubu Güncelle</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekendListContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  weekendItem: {
    padding: 10,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    minWidth: 120,
    alignItems: 'center',
  },
  selectedWeekend: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  weekNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  dayName: {
    fontSize: 16,
    color: '#333',
    marginVertical: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  grupContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 10,
    padding: 10,
    elevation: 2,
  },
  grupBaslik: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 10,
    textAlign: 'center',
  },
  uyeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  uyeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  uyeNumara: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    width: 30,
  },
  uyeAd: {
    fontSize: 16,
    fontWeight: '500',
  },
  uyeTc: {
    fontSize: 14,
    color: '#666',
  },
  yoklamaButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  yoklamaButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    marginHorizontal: 4,
  },
  selectedGeldi: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
  },
  selectedGelmedi: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  inactiveButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.7,
  },
  updateButton: {
    backgroundColor: '#2196f3',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Yoklama;

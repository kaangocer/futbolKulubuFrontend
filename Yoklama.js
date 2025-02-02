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
import { useNavigation } from '@react-navigation/native';
import Modal from 'react-native-modal';

const Yoklama = () => {
  const [groupedUyeler, setGroupedUyeler] = useState({});
  const [yoklamaDurumu, setYoklamaDurumu] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedYoklamalar, setSelectedYoklamalar] = useState({});
  const [weekends, setWeekends] = useState([]);
  const [uyeler, setUyeler] = useState([]);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(moment().month());
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [tempMonth, setTempMonth] = useState(moment().month());
  const [tempYear, setTempYear] = useState(moment().year());
  
  // Yıl listesi oluştur (5 yıl öncesinden 5 yıl sonrasına)
  const years = Array.from(
    { length: 11 },
    (_, i) => moment().year() - 5 + i
  );

  // Ay listesi
  const months = moment.months();

  // useRef ile son seçilen tarihi tut
  const lastSelectedDate = useRef(null);

  const navigation = useNavigation();

  useEffect(() => {
    fetchUyelerVeGruplar();
    generateWeekends();
  }, []);

  

  useEffect(() => {
    if (selectedDate) {
      fetchYoklamalar(moment(selectedDate).format('YYYY-MM-DD'));
    }
  }, [selectedDate]);

  const handleMonthYearSelect = (month, year) => {
    setTempMonth(month);
    setTempYear(year);
  };

  const handleDateConfirm = () => {
    setSelectedMonth(tempMonth);
    setSelectedYear(tempYear);
    setDatePickerVisible(false);
    generateWeekends(tempMonth, tempYear);
  };

  // Modal açılırken geçici değerleri güncelle
  const handleOpenModal = () => {
    setTempMonth(selectedMonth);
    setTempYear(selectedYear);
    setDatePickerVisible(true);
  };

  // generateWeekends fonksiyonunu güncelle
  const generateWeekends = useCallback((month = selectedMonth, year = selectedYear) => {
    const startOfMonth = moment().year(year).month(month).startOf('month');
    const endOfMonth = moment().year(year).month(month).endOf('month');
    const weekendDays = [];

    let currentDay = startOfMonth.clone();
    
    while (currentDay.isSameOrBefore(endOfMonth)) {
      if (currentDay.day() === 6 || currentDay.day() === 0) {
        weekendDays.push({
          date: currentDay.clone(),
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
  }, [selectedMonth, selectedYear]);

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

    // Onay dialogu göster
    Alert.alert(
      "Yoklama Güncelleme",
      "Seçili yoklamaları güncellemek istediğinize emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel"
        },
        {
          text: "Güncelle",
          onPress: async () => {
            try {
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
              
              setYoklamaDurumu(yeniYoklamalar);
              setSelectedYoklamalar({});
              setLoading(false);
              
              // Başarı mesajı göster
              Alert.alert(
                "Başarılı", 
                "Yoklamalar başarıyla güncellendi!",
                [{ text: "Tamam" }]
              );

            } catch (error) {
              setLoading(false);
              console.error('Yoklama kaydedilirken hata:', error);
              Alert.alert(
                "Hata",
                "Yoklama güncellenirken bir hata oluştu. Lütfen tekrar deneyin.",
                [{ text: "Tamam" }]
              );
            }
          },
          style: "default"
        }
      ]
    );
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
      <View style={styles.monthSelector}>
        <TouchableOpacity 
          style={styles.monthYearButton}
          onPress={handleOpenModal}
        >
          <Text style={styles.monthYearText}>
            {moment().month(selectedMonth).locale('tr').format('MMMM')} {selectedYear}
          </Text>
          <Icon name="calendar-today" size={24} color="#1976d2" />
        </TouchableOpacity>
      </View>

      <Modal
        isVisible={isDatePickerVisible}
        onBackdropPress={() => setDatePickerVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Ay ve Yıl Seçin</Text>
          
          <View style={styles.datePickerContainer}>
            <ScrollView style={styles.pickerScrollView}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.pickerItem,
                    tempMonth === index && styles.selectedPickerItem
                  ]}
                  onPress={() => handleMonthYearSelect(index, tempYear)}
                >
                  <Text style={[
                    styles.pickerItemText,
                    tempMonth === index && styles.selectedPickerItemText
                  ]}>
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.pickerScrollView}>
              {years.map(year => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.pickerItem,
                    tempYear === year && styles.selectedPickerItem
                  ]}
                  onPress={() => handleMonthYearSelect(tempMonth, year)}
                >
                  <Text style={[
                    styles.pickerItemText,
                    tempYear === year && styles.selectedPickerItemText
                  ]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setDatePickerVisible(false)}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleDateConfirm}
            >
              <Text style={styles.confirmButtonText}>Ara</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.weekendListContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekendListContent}
          style={styles.weekendList}
        >
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
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {Object.entries(groupedUyeler).map(([grupId, grupData]) => (
          <View key={grupId} style={styles.grupContainer}>
            <Text style={styles.grupBaslik}>{grupData.grupAdi}</Text>
            {grupData.uyeler.map((uye, index) => (
              <View 
                key={uye.UyeId} 
                style={[
                  styles.uyeRow,
                  index % 2 === 0 ? styles.evenRow : styles.oddRow
                ]}
              >
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
            {/* Her grubun altında sürekli görünür güncelleme butonu */}
            <TouchableOpacity 
              style={[
                styles.updateButton,
                Object.keys(selectedYoklamalar).length === 0 && styles.updateButtonDisabled
              ]}
              onPress={() => handleYoklamaUpdate(grupId)}
              disabled={Object.keys(selectedYoklamalar).length === 0}
            >
              <Text style={[
                styles.updateButtonText,
                Object.keys(selectedYoklamalar).length === 0 && styles.updateButtonTextDisabled
              ]}>
                Grubu Güncelle
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity 
        style={styles.gecmisButton}
        onPress={() => navigation.navigate('YoklamaGecmisi')}
      >
        <Text style={styles.gecmisButtonText}>Yoklama Geçmişi</Text>
      </TouchableOpacity>
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
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    height: 190, // Sabit yükseklik
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  monthSelector: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  monthYearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '100%',
    justifyContent: 'center',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2196F3',
    textTransform: 'capitalize',
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#1976d2',
    letterSpacing: 0.5,
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  pickerScrollView: {
    flex: 1,
    maxHeight: 320,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    padding: 8,
  },
  pickerItem: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedPickerItem: {
    backgroundColor: '#2196F3',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pickerItemText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#424242',
    fontWeight: '500',
  },
  selectedPickerItemText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  weekendList: {
    flex: 1,
  },
  weekendListContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  weekendItem: {
    padding: 12,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    width: 135,
    height: 140, // Yükseklik artırıldı
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedWeekend: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
    borderWidth: 2,
    shadowColor: '#1976d2',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  weekNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  dayName: {
    fontSize: 16,
    color: '#424242',
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 4,
    letterSpacing: 0.25,
  },
  dateText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.25,
  },
  scrollView: {
    flex: 1,
    marginTop: 5,
  },
  scrollViewContent: {
    padding: 10,
  },
  grupContainer: {
    marginTop: 5,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  grupBaslik: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 12,
    backgroundColor: '#1976d2',
    color: '#ffffff',
    marginBottom: 0,
    textAlign: 'center',
    elevation: 1,
  },
  uyeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  evenRow: {
    backgroundColor: '#ffffff',
  },
  oddRow: {
    backgroundColor: '#f5f5f5',
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
    color: '#1976d2',
  },
  uyeAd: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  uyeTc: {
    fontSize: 14,
    color: '#666666',
  },
  yoklamaButtons: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 10,
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
    backgroundColor: '#2196F3',
    padding: 12,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  updateButtonDisabled: {
    backgroundColor: '#e0e0e0',
    shadowOpacity: 0,
    elevation: 0,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  updateButtonTextDisabled: {
    color: '#9e9e9e',
  },
  gecmisButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  gecmisButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  confirmButton: {
    backgroundColor: '#2196F3',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Yoklama;

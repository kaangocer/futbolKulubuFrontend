import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/tr';  // Türkçe tarih formatı için

const YoklamaGecmisi = () => {
  const [loading, setLoading] = useState(true);
  const [uyeler, setUyeler] = useState([]);
  const [yoklamalar, setYoklamalar] = useState([]);
  const [selectedUye, setSelectedUye] = useState(null);
  const [selectedAy, setSelectedAy] = useState(moment().format('MM')); // Şu anki ay
  const [selectedYil, setSelectedYil] = useState(moment().format('YYYY')); // Şu anki yıl

  const aylar = [
    { label: 'Ocak', value: '01' },
    { label: 'Şubat', value: '02' },
    { label: 'Mart', value: '03' },
    { label: 'Nisan', value: '04' },
    { label: 'Mayıs', value: '05' },
    { label: 'Haziran', value: '06' },
    { label: 'Temmuz', value: '07' },
    { label: 'Ağustos', value: '08' },
    { label: 'Eylül', value: '09' },
    { label: 'Ekim', value: '10' },
    { label: 'Kasım', value: '11' },
    { label: 'Aralık', value: '12' },
  ];

  // Şu anki yıldan 10 yıl öncesi ve 10 yıl sonrası için yıl listesi oluştur
  const yillar = Array.from({ length: 21 }, (_, i) => {
    const yil = moment().year() - 10 + i; // Şu anki yıldan 10 yıl önce başla, 10 yıl sonrasına kadar git
    return {
      label: yil.toString(),
      value: yil.toString()
    };
  }).sort((a, b) => b.value - a.value); // Yılları büyükten küçüğe sırala

  useEffect(() => {
    fetchUyeler();
  }, []);

  useEffect(() => {
    if (selectedUye && selectedAy && selectedYil) {
      fetchYoklamalar();
    }
  }, [selectedUye, selectedAy, selectedYil]);

  const fetchUyeler = async () => {
    try {
      const response = await axios.get('http://192.168.1.21:3000/uyeler');
      setUyeler(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Üyeler yüklenirken hata:', error);
      setLoading(false);
    }
  };

  const fetchYoklamalar = async () => {
    try {
      setLoading(true);
      
      const startOfMonth = moment(`${selectedYil}-${selectedAy}-01`);
      const endOfMonth = moment(startOfMonth).endOf('month');
      const weekendDays = [];
      
      let currentDay = startOfMonth.clone();
      while (currentDay.isSameOrBefore(endOfMonth)) {
        if (currentDay.day() === 6 || currentDay.day() === 0) {
          weekendDays.push(currentDay.clone());
        }
        currentDay.add(1, 'day');
      }

      const processedYoklamalar = await Promise.all(
        weekendDays.map(async (date) => {
          const formattedDate = date.format('DD-MM-YYYY');
          try {
            const response = await axios.get(
              `http://192.168.1.21:3000/yoklamalar/tarih/${formattedDate}`
            );

            const existingYoklama = response.data?.find(y => 
              y.UyeId === parseInt(selectedUye)
            );

            return {
              YoklamaId: existingYoklama?.YoklamaId || `${date.format('YYYY-MM-DD')}-${selectedUye}`,
              UyeId: parseInt(selectedUye),
              Tarih: date.toDate(),
              YoklamaDurum: existingYoklama?.YoklamaDurum || 'Gelmedi',
              weekNumber: Math.ceil(date.date() / 7),
              dayName: date.locale('tr').format('dddd'),
              formattedDate: date.format('DD-MM-YYYY')
            };
          } catch (error) {
            return {
              YoklamaId: `${date.format('YYYY-MM-DD')}-${selectedUye}`,
              UyeId: parseInt(selectedUye),
              Tarih: date.toDate(),
              YoklamaDurum: 'Gelmedi',
              weekNumber: Math.ceil(date.date() / 7),
              dayName: date.locale('tr').format('dddd'),
              formattedDate: date.format('DD-MM-YYYY')
            };
          }
        })
      );

      const groupedYoklamalar = processedYoklamalar.reduce((acc, yoklama) => {
        const weekKey = yoklama.weekNumber;
        if (!acc[weekKey]) {
          acc[weekKey] = [];
        }
        acc[weekKey].push(yoklama);
        return acc;
      }, {});

      const finalYoklamalar = Object.entries(groupedYoklamalar).map(([weekNumber, yoklamalar]) => ({
        weekNumber: parseInt(weekNumber),
        yoklamalar: yoklamalar.sort((a, b) => {
          const dayA = moment(a.Tarih).day();
          const dayB = moment(b.Tarih).day();
          return dayA === 0 ? 1 : dayB === 0 ? -1 : 0;
        })
      }));

      setYoklamalar(finalYoklamalar);
      setLoading(false);
    } catch (error) {
      setYoklamalar([]);
      setLoading(false);
    }
  };

  const renderYoklamaItem = ({ item }) => {
    return (
      <View style={styles.weekContainer}>
        <Text style={styles.weekTitle}>{`${item.weekNumber}. Hafta`}</Text>
        {item.yoklamalar.map((yoklama) => (
          <View 
            key={yoklama.YoklamaId || `${yoklama.formattedDate}-${yoklama.UyeId}`}
            style={[
              styles.yoklamaItem,
              { borderLeftColor: yoklama.YoklamaDurum === 'Geldi' ? '#4CAF50' : '#F44336' }
            ]}
          >
            <View style={styles.yoklamaInfo}>
              <Text style={styles.gunAdi}>
                {`${yoklama.dayName} - ${yoklama.formattedDate}`}
              </Text>
            </View>
            <Text style={[
              styles.durumText,
              { color: yoklama.YoklamaDurum === 'Geldi' ? '#4CAF50' : '#F44336' }
            ]}>
              {yoklama.YoklamaDurum}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Katılım istatistiği hesaplama fonksiyonu
  const getKatilimIstatistigi = () => {
    if (!yoklamalar.length) return { toplam: 0, katilim: 0 };
    
    let toplamGun = 0;
    let katilimSayisi = 0;

    yoklamalar.forEach(hafta => {
      hafta.yoklamalar.forEach(yoklama => {
        toplamGun++;
        if (yoklama.YoklamaDurum === 'Geldi') {
          katilimSayisi++;
        }
      });
    });

    return { toplam: toplamGun, katilim: katilimSayisi };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          data={uyeler.map(uye => ({
            label: `${uye.Ad} ${uye.SoyAd}`,
            value: uye.UyeId
          }))}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Üye Seçin"
          value={selectedUye}
          onChange={item => setSelectedUye(item.value)}
          search
          searchPlaceholder="Ara..."
        />

        <View style={styles.dateFilterContainer}>
          <Dropdown
            style={[styles.dropdown, styles.dateDropdown]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={aylar}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Ay Seçin"
            value={selectedAy}
            onChange={item => setSelectedAy(item.value)}
          />

          <Dropdown
            style={[styles.dropdown, styles.dateDropdown]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={yillar}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Yıl Seçin"
            value={selectedYil}
            onChange={item => setSelectedYil(item.value)}
          />
        </View>
      </View>

      {selectedUye && selectedAy && (
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedTitle}>
            {uyeler.find(u => u.UyeId === selectedUye)?.Ad} {uyeler.find(u => u.UyeId === selectedUye)?.SoyAd}
          </Text>
          <Text style={styles.selectedDate}>
            {aylar.find(a => a.value === selectedAy)?.label} {selectedYil}
          </Text>
          
          {/* Katılım istatistiği */}
          <View style={styles.katilimContainer}>
            <View style={styles.katilimInfo}>
              <Text style={styles.katilimLabel}>Toplam Gün</Text>
              <Text style={styles.katilimValue}>{getKatilimIstatistigi().toplam}</Text>
            </View>
            <View style={styles.katilimDivider} />
            <View style={styles.katilimInfo}>
              <Text style={styles.katilimLabel}>Katılım</Text>
              <Text style={[
                styles.katilimValue, 
                styles.katilimSuccess
              ]}>
                {getKatilimIstatistigi().katilim}
              </Text>
            </View>
            <View style={styles.katilimDivider} />
            <View style={styles.katilimInfo}>
              <Text style={styles.katilimLabel}>Devamsızlık</Text>
              <Text style={[
                styles.katilimValue, 
                styles.katilimDanger
              ]}>
                {getKatilimIstatistigi().toplam - getKatilimIstatistigi().katilim}
              </Text>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={yoklamalar}
        renderItem={renderYoklamaItem}
        keyExtractor={(item, index) => `${item.weekNumber}-${index}`}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {selectedUye && selectedAy ? 
              'Seçilen tarih aralığında yoklama kaydı bulunamadı.' : 
              'Lütfen üye ve tarih seçin.'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10, // Dropdown'lar arasında boşluk
  },
  dropdown: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dateDropdown: {
    flex: 1, // Her iki dropdown da eşit genişlikte olacak
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#666',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#333',
  },
  selectedInfo: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    marginHorizontal: 10,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  selectedDate: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 12, // İstatistik kutusu için margin eklendi
  },
  weekContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
    elevation: 2,
    marginHorizontal: 10,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  yoklamaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    borderLeftWidth: 4,
  },
  yoklamaInfo: {
    flex: 1,
  },
  gunAdi: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  durumText: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    paddingVertical: 6,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    padding: 20,
  },
  katilimContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  katilimInfo: {
    flex: 1,
    alignItems: 'center',
  },
  katilimLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  katilimValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  katilimSuccess: {
    color: '#4CAF50',
  },
  katilimDanger: {
    color: '#F44336',
  },
  katilimDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
});

export default YoklamaGecmisi;

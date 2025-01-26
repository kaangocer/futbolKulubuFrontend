import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
        paddingTop: 100,paddingHorizontal:10,paddingVertical:10,
      },
      buttonsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly', // Butonlar eşit aralıklarda yerleşir
        marginVertical: 10,
      },
      
      gridButton: {
        width: '48%', // Eşit genişlikte iki buton olacak şekilde ayarlandı
        height: 120,
        backgroundColor: '#CCCCCC',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 3, // Gölge efekti
      },
      gridButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        marginTop: 10,
        textAlign: 'center',
      },
      aidatButton: {
        backgroundColor: '#4CAF50',
      },
      yoklamaButton: {
        backgroundColor: '#2196F3',
      },
      formalarButton: {
        backgroundColor: '#FF9800',
      },
      gruplarButton: {
        backgroundColor: '#9C27B0',
      },
      kullanicilarButton: {
        backgroundColor: '#F44336',
      },
  buttonScroll: {
    width: '100%',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginBottom: 10,
  },
  
  button: {
    width: 140,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  
  buttonText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  
  button: {
    width: 140,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  searchInput: {
    width: '100%',
    padding: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 10,
    fontSize: 16,
  },
  selectedGroupTitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  dropdownButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cccccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    width: '80%',
    borderRadius: 8,
    padding: 20,
  },
  groupItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  groupItemText: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    marginTop: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  
  },
  tableScroll: {
    width: '100%',
    marginTop: 20,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tableHeader: {
    backgroundColor: '#f39c12',
  },
  tableHeaderText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#ffffff',
    fontSize: 14,
    padding: 5,
  },
  tableCell: {
    textAlign: 'center',
    padding: 5,
    fontSize: 13,
  },
  logoutButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FF5C5C', // Dilerseniz rengini değiştirebilirsiniz
    padding: 10,
    borderRadius: 50,
    zIndex: 10, // Diğer butonların üstünde görünmesini sağlar
  },
  
  
});

export default styles;

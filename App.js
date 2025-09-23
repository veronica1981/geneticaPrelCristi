// App.tsx (or App.js)
import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import VersionCheck from 'react-native-version-check-expo';
import ControlNou from './controlnou';

export default function App() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanText, setScanText] = useState('Not yet scanned');
  const [showScanner, setShowScanner] = useState(false);

  // 1) Ask camera permission (CameraView)
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // 2) Check latest store version on mount
  useEffect(() => {
    (async () => {
      try {
        const currentVersion = VersionCheck.getCurrentVersion(); // from app.json expo.version
        const latestVersion = await VersionCheck.getLatestVersion(); // from store
        const need = await VersionCheck.needUpdate({ currentVersion, latestVersion });
        const isNeeded = typeof need === 'object' ? need?.isNeeded : !!need;

        if (isNeeded) {
          Alert.alert(
              'Update disponibil',
              `Va rugam sa actualizati aplicatia cu ultima versiune din Magazinul Google`,
              [
                { text: 'Mai tarziu' },
                { text: 'Actualizare', onPress: () => VersionCheck.goToAppStore() },
              ]
          );
        }
      } catch (err) {
        // Non-fatal: just log
        console.log('Version check failed:', err?.message || err);
      }
    })();
  }, []);

  // 3) Handle barcode scanned
  const handleBarCodeScanned = ({ data, type }) => {
    setScanned(true);
    setScanText(data);
    setShowScanner(false);
    console.log('Type:', type, 'Data:', data);
  };

  // 4) Permission screens
  if (hasPermission === null) {
    return (
        <View style={styles.center}>
          <Text>Requesting camera permission…</Text>
        </View>
    );
  }
  if (hasPermission === false) {
    return (
        <View style={styles.center}>
          <Text style={{ margin: 10 }}>No access to camera</Text>
          <Button
              title="Allow Camera"
              onPress={async () => {
                const { status } = await Camera.requestCameraPermissionsAsync();
                setHasPermission(status === 'granted');
              }}
          />
        </View>
    );
  }

  // 5) UI: toggle CameraView + your existing screen
  return (
      <View style={{ flex: 1 }}>
        {showScanner ? (
            <View style={styles.scannerWrap}>
              <CameraView
                  style={styles.camera}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{ barcodeTypes: ['code128', 'ean13', 'qr'] }}
              />
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowScanner(false)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
        ) : (
            <View style={{ flex: 1 }}>
              <View style={styles.header}>
                <Button
                    title="Scan barcode"
                    onPress={() => {
                      setScanned(false);
                      setShowScanner(true);
                    }}
                />
                <Text style={styles.scanResult} numberOfLines={1}>
                  {scanText}
                </Text>
              </View>

              <ControlNou
                  onCellChange={(value, column, row, unique_id) => {
                    console.log(`Cell Change on Column: ${column} Row: ${row} id: ${unique_id}`, value);
                  }}
                  customStyles={{}}
                  style={styles.table}
              />
            </View>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 12, gap: 8 },
  scanResult: { marginTop: 8, fontSize: 14, color: '#333' },
  table: { padding: 12 },
  scannerWrap: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#00000088',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeBtnText: { color: '#fff', fontSize: 16 },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Header, Field, GoldButton } from '../components/ui';
import colors from '../theme/colors';
import { radius, serif, shadow } from '../theme/styles';
import { usePartner } from '../context/PartnerContext';
import { VendorService } from '../services/api';
import { roleMeta } from '../data/mock';

export default function EditProfileScreen({ navigation }) {
  const { vendor, role, register } = usePartner();
  const meta = roleMeta[role] || { label: 'Partner' };

  const [name, setName] = useState(vendor?.name || '');
  const [city, setCity] = useState(vendor?.city || '');
  const [phone, setPhone] = useState(vendor?.phone || '');
  const [email, setEmail] = useState(vendor?.email || '');
  const [bio, setBio] = useState(vendor?.bio || '');
  const [photo, setPhoto] = useState(vendor?.photo || vendor?.profileImage || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Role specific states
  const [degree, setDegree] = useState(vendor?.degree || '');
  const [gurukul, setGurukul] = useState(vendor?.gurukul || '');
  const [troupeSize, setTroupeSize] = useState(vendor?.troupeSize || '');
  const [leadSinger, setLeadSinger] = useState(vendor?.leadSinger || '');
  const [chatRate, setChatRate] = useState(vendor?.rates?.chat || vendor?.chatRate || '25');
  const [callRate, setCallRate] = useState(vendor?.rates?.call || vendor?.callRate || '35');

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('अनुमति आवश्यक', 'फ़ोटो गैलरी एक्सेस की अनुमति दें।');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: role === 'mandali' ? [16, 9] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhoto(asset.uri);
        setUploading(true);

        const formData = new FormData();
        formData.append('photo', {
          uri: asset.uri,
          name: `profile_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
        formData.append('folder', `vaidic_sanskar_${role}`);

        try {
          const res = await VendorService.uploadPhoto(formData);
          if (res?.url || res?.secure_url) {
            const finalUrl = res.secure_url || res.url;
            setPhoto(finalUrl);
            Alert.alert('फ़ोटो अपलोड सफल! ✓', 'क्लाउडिनरी सर्वर पर फ़ोटो अपडेट हो गई है।');
          }
        } catch (e) {
          console.warn('Direct upload notice:', e?.message);
        } finally {
          setUploading(false);
        }
      }
    } catch (e) {
      setUploading(false);
      Alert.alert('त्रुटि', 'फ़ोटो चयन में त्रुटि: ' + e.message);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('अपूर्ण', 'कृपया अपना नाम दर्ज करें।');
      return;
    }

    setSaving(true);
    const updated = {
      ...vendor,
      name,
      city,
      phone,
      email,
      bio,
      photo,
      profileImage: photo,
      degree,
      gurukul,
      troupeSize,
      leadSinger,
      rates: role === 'astro' ? { chat: chatRate, call: callRate } : vendor?.rates,
    };

    try {
      await VendorService.updateProfile(updated);
      register(updated);
      Alert.alert('सफल! 🙏', 'आपकी प्रोफ़ाइल जानकारी सफलतापूर्वक अपडेट हो गई है।', [
        { text: 'ठीक है', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      register(updated);
      Alert.alert('सहेजा गया', 'स्थानीय रूप से प्रोफ़ाइल अपडेट हो गई है।', [
        { text: 'ठीक है', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <Header title="प्रोफ़ाइल संपादन (Edit Profile)" navigation={navigation} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Photo avatar header */}
        <View style={s.avatarWrap}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8} style={s.avatarBox}>
            {photo ? (
              <Image source={{ uri: photo }} style={s.avatarImg} />
            ) : (
              <MaterialCommunityIcons name="account" size={54} color={colors.gold} />
            )}
            {uploading && (
              <View style={s.loadingOverlay}>
                <ActivityIndicator color="#FFF" />
              </View>
            )}
            <View style={s.camIcon}>
              <MaterialCommunityIcons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={s.changePhotoText} onPress={handlePickPhoto}>
            फ़ोटो बदलें (Cloudinary)
          </Text>
        </View>

        <Field label="नाम *" icon="account" value={name} onChangeText={setName} />
        <Field label="मोबाइल नंबर" icon="phone" editable={false} value={phone} />
        <Field label="ईमेल आईडी" icon="email" value={email} onChangeText={setEmail} />
        <Field label="शहर / कार्यक्षेत्र" icon="map-marker" value={city} onChangeText={setCity} />

        {role === 'pandit' && (
          <>
            <Field label="शास्त्रीय डिग्री / उपाधि" icon="certificate" value={degree} onChangeText={setDegree} />
            <Field label="गुरुकुल / संस्थान" icon="school" value={gurukul} onChangeText={setGurukul} />
          </>
        )}

        {role === 'mandali' && (
          <>
            <Field label="प्रधान गायक" icon="microphone" value={leadSinger} onChangeText={setLeadSinger} />
            <Field label="कलाकारों की संख्या" icon="account-group" value={troupeSize} onChangeText={setTroupeSize} />
          </>
        )}

        {role === 'astro' && (
          <>
            <Field label="संक्षिप्त परिचय (Bio)" icon="text" multiline numberOfLines={3} value={bio} onChangeText={setBio} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field label="Chat ₹/min" keyboardType="numeric" value={chatRate} onChangeText={setChatRate} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Call ₹/min" keyboardType="numeric" value={callRate} onChangeText={setCallRate} />
              </View>
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
        <GoldButton
          title={saving ? 'सहेज रहे हैं...' : 'परिवर्तन सुरक्षित करें ✓'}
          onPress={handleSave}
          disabled={saving}
        />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  avatarWrap: { alignItems: 'center', marginBottom: 20 },
  avatarBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#3A0B0F',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: colors.gold,
    ...shadow,
  },
  avatarImg: { width: '100%', height: '100%' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.maroon,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  changePhotoText: { color: colors.maroon, fontWeight: '700', fontSize: 13, marginTop: 8 },
});

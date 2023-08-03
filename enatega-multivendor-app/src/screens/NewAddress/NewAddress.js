import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useLayoutEffect
} from 'react'
import {
  View,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import i18n from '../../../i18n'
import styles from './styles'
import { OutlinedTextField } from 'react-native-material-textfield'
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import gql from 'graphql-tag'
import { scale } from '../../utils/scaling'
import { createAddress } from '../../apollo/mutations'
import { useMutation } from '@apollo/client'
import ThemeContext from '../../ui/ThemeContext/ThemeContext'
import { theme } from '../../utils/themeColors'
import { FlashMessage } from '../../ui/FlashMessage/FlashMessage'
import TextDefault from '../../components/Text/TextDefault/TextDefault'
import { alignment } from '../../utils/alignment'
import { LocationContext } from '../../context/Location'
import { mapStyle } from '../../utils/mapStyle'
import SearchModal from '../../components/Address/SearchModal'
import Analytics from '../../utils/analytics'
import { MaterialIcons, Entypo, Foundation } from '@expo/vector-icons'
import { HeaderBackButton } from '@react-navigation/elements'
import navigationService from '../../routes/navigationService'
const CREATE_ADDRESS = gql`
  ${createAddress}
`

const labelValues = [
  {
    title: 'Home',
    value: 'Home',
    icon: <Entypo name="home" size={24} />
  },
  {
    title: 'Work',
    value: 'Work',
    icon: <MaterialIcons name="work" size={24} />
  },
  {
    title: 'Other',
    value: 'Other',
    icon: <Foundation name="heart" size={24} />
  }
]

const LATITUDE = 33.7001019
const LONGITUDE = 72.9735978
const LATITUDE_DELTA = 0.0022
const LONGITUDE_DELTA = 0.0021

function NewAddress(props) {
  const addressRef = useRef()
  const inset = useSafeAreaInsets()
  const [modalVisible, setModalVisible] = useState(false)
  const location = props.route.params ? props.route.params.location : null
  const { setLocation } = useContext(LocationContext)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryDetails, setDeliveryDetails] = useState('')
  const [deliveryAddressError, setDeliveryAddressError] = useState('')
  const [deliveryDetailsError, setDeliveryDetailsError] = useState('')
  const [selectedLabel, setSelectedLabel] = useState(labelValues[0].value)
  const [region, setRegion] = useState({
    latitude: location ? location.latitude : LATITUDE,
    latitudeDelta: LATITUDE_DELTA,
    longitude: location ? location.longitude : LONGITUDE,
    longitudeDelta: LONGITUDE_DELTA
  })

  const regionObj = props.route.params ? props.route.params.regionChange : null
  const themeContext = useContext(ThemeContext)
  const currentTheme = theme[themeContext.ThemeValue]
  useEffect(() => {
    async function Track() {
      await Analytics.track(Analytics.events.NAVIGATE_TO_NEWADDRESS)
    }
    Track()
  }, [])
  useLayoutEffect(() => {
    props.navigation.setOptions({
      headerRight: null,
      title: i18n.t('addAddress'),
      headerStyle: {
        backgroundColor: currentTheme.headerColor,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20
      },
      headerTitleContainerStyle: {
        marginBottom: scale(10),
        paddingLeft: scale(20),
        paddingRight: scale(20),
        backgroundColor: 'black',
        borderWidth: 1,
        borderColor: 'white',
        borderRadius: scale(10),
        marginLeft: 0
      },
      headerTitleAlign: 'center',
      headerRight: null,
      headerLeft: () => (
        <HeaderBackButton
          backImage={() => (
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 50,
                marginLeft: 10,
                width: 55,
                alignItems: 'center'
              }}>
              <MaterialIcons name="arrow-back" size={30} color="black" />
            </View>
          )}
          onPress={() => {
            navigationService.goBack()
          }}
        />
      )
    })
  }, [props.navigation])

  useEffect(() => {
    if (!regionObj) return regionChange(region)
    regionChange(regionObj)
  }, [regionObj])

  const [mutate, { loading }] = useMutation(CREATE_ADDRESS, {
    onCompleted,
    onError
  })

  function regionChange(region) {
    Location.reverseGeocodeAsync({
      latitude: region.latitude,
      longitude: region.longitude
    })
      .then(data => {
        if (data.length) {
          const location = data[0]
          const deliveryAddress = Object.keys(location)
            .map(key => location[key])
            .join(' ')
          setDeliveryAddress(deliveryAddress)
          setRegion(region)
          addressRef.current.setValue(deliveryAddress)
        } else console.log('location not recognized')
      })
      .catch(error => {
        console.log('Error : regionChange', error)
      })
  }

  function onCompleted(data) {
    FlashMessage({
      message: 'Address added'
    })
    const address = data.createAddress.addresses.find(a => a.selected)
    const cartAddress = props.route.params?.backScreen || null
    setLocation({
      ...address,
      latitude: parseFloat(address.location.coordinates[1]),
      longitude: parseFloat(address.location.coordinates[0])
    })
    if (cartAddress === 'Cart') {
      props.navigation.navigate('Cart')
    } else props.navigation.goBack()
  }

  function onError(error) {
    console.log(error)
    FlashMessage({
      message: `An error occured. Please try again. ${error}`
    })
  }

  const onOpen = () => {
    setModalVisible(true)
  }
  const onClose = () => {
    setModalVisible(false)
  }

  const onSubmit = (deliveryAddressGeo, coordinates) => {
    setDeliveryAddress(deliveryAddressGeo)
    addressRef.current.setValue(deliveryAddressGeo)
    setRegion({
      ...region,
      longitude: coordinates.lng,
      latitude: coordinates.lat
    })
    setModalVisible(false)
  }

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 20 : 0}
        style={styles().flex}
        enabled={!modalVisible}>
        <View style={styles().flex}>
          <View style={styles().mapContainer}>
            <MapView
              style={styles().flex}
              scrollEnabled={false}
              zoomEnabled={false}
              zoomControlEnabled={false}
              rotateEnabled={false}
              cacheEnabled={true}
              showsUserLocation={false}
              customMapStyle={mapStyle}
              // customMapStyle={
              //   themeContext.ThemeValue === 'Dark' ? mapStyle : null
              // }
              initialRegion={{
                latitude: LATITUDE,
                latitudeDelta: LATITUDE_DELTA,
                longitude: LONGITUDE,
                longitudeDelta: LONGITUDE_DELTA
              }}
              region={region}
              provider={PROVIDER_GOOGLE}
              onPress={() => {
                props.navigation.navigate('FullMap', {
                  latitude: region.latitude,
                  longitude: region.longitude,
                  currentScreen: 'NewAddress'
                })
              }}></MapView>
            <View
              style={{
                width: 50,
                height: 50,
                position: 'absolute',
                top: '50%',
                left: '50%',
                zIndex: 1,
                translateX: -25,
                translateY: -25,
                justifyContent: 'center',
                alignItems: 'center',
                transform: [{ translateX: -25 }, { translateY: -25 }]
              }}>
              <Image
                source={require('../../assets/images/user.png')}
                width={20}
              />
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}>
            <View style={styles(currentTheme).subContainer}>
              <View style={styles().upperContainer}>
                <View style={styles().addressContainer}>
                  <View style={styles().geoLocation}>
                    <View style={{ width: '100%' }}>
                      <OutlinedTextField
                        placeholder="Delivery Address"
                        error={deliveryAddressError}
                        ref={addressRef}
                        value={deliveryAddress}
                        label={i18n.t('fullDeliveryAddress')}
                        labelFontSize={scale(12)}
                        fontSize={scale(12)}
                        renderRightAccessory={() => (
                          <TouchableOpacity onPress={onOpen}>
                            <MaterialIcons
                              name="edit"
                              size={18}
                              color={currentTheme.fontSecondColor}
                            />
                          </TouchableOpacity>
                        )}
                        maxLength={100}
                        textColor={currentTheme.fontMainColor}
                        baseColor={currentTheme.fontSecondColor}
                        errorColor={currentTheme.textErrorColor}
                        tintColor={
                          !deliveryAddressError ? currentTheme.tagColor : 'red'
                        }
                        labelTextStyle={{
                          fontSize: scale(12),
                          paddingTop: scale(1)
                        }}
                        onChangeText={text => {
                          setDeliveryAddress(text)
                        }}
                        onBlur={() => {
                          setDeliveryAddressError(
                            !deliveryAddress.trim().length
                              ? 'Delivery address is required'
                              : null
                          )
                        }}
                      />
                    </View>
                  </View>
                  <View style={{ ...alignment.MTlarge }}></View>
                  <OutlinedTextField
                    placeholder="Apt / Floor"
                    error={deliveryDetailsError}
                    label={i18n.t('deliveryDetails')}
                    labelFontSize={scale(12)}
                    fontSize={scale(12)}
                    textAlignVertical="top"
                    multiline={false}
                    maxLength={30}
                    textColor={currentTheme.fontMainColor}
                    baseColor={currentTheme.fontSecondColor}
                    errorColor={currentTheme.textErrorColor}
                    tintColor={
                      !deliveryDetailsError ? currentTheme.tagColor : 'red'
                    }
                    labelOffset={{ y1: -5 }}
                    labelTextStyle={{
                      fontSize: scale(12),
                      paddingTop: scale(1)
                    }}
                    value={deliveryDetails}
                    onChangeText={text => {
                      setDeliveryDetails(text)
                    }}
                    onBlur={() => {
                      setDeliveryDetailsError(
                        !deliveryDetails.trim().length
                          ? 'Delivery details is required'
                          : null
                      )
                    }}
                  />
                </View>

                <View style={styles().labelButtonContainer}>
                  <View style={styles().labelTitleContainer}>
                    <View style={styles().horizontalLine} />
                    <TextDefault
                      textColor={currentTheme.fontMainColor}
                      h5
                      bolder>
                      Add Label
                    </TextDefault>
                  </View>
                  <View style={styles().buttonInline}>
                    {labelValues.map((label, index) => (
                      <>
                        <TouchableOpacity
                          activeOpacity={0.5}
                          key={index}
                          style={
                            selectedLabel === label.value
                              ? styles(currentTheme).activeLabel
                              : styles(currentTheme).labelButton
                          }
                          onPress={() => {
                            setSelectedLabel(label.value)
                          }}>
                          <TextDefault
                            textColor={
                              selectedLabel === label.value
                                ? currentTheme.white
                                : currentTheme.fontMainColor
                            }
                            bold
                            center>
                            {label.icon}
                          </TextDefault>
                        </TouchableOpacity>
                      </>
                    ))}
                  </View>

                  <View style={styles().textbuttonInline}>
                    {labelValues.map((label, index) => (
                      <>
                        <TextDefault
                          style={styles().titlebuttonInline}
                          textColor={currentTheme.black}
                          bold
                          center>
                          {label.title}
                        </TextDefault>
                      </>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity
              disabled={loading}
              onPress={() => {
                const deliveryAddressError = !deliveryAddress.trim().length
                  ? 'Delivery address is required'
                  : null
                const deliveryDetailsError = !deliveryDetails.trim().length
                  ? 'Delivery details is required'
                  : null

                setDeliveryAddressError(deliveryAddressError)
                setDeliveryDetailsError(deliveryDetailsError)

                if (
                  deliveryAddressError === null &&
                  deliveryDetailsError === null
                ) {
                  mutate({
                    variables: {
                      addressInput: {
                        latitude: `${region.latitude}`,
                        longitude: `${region.longitude}`,
                        deliveryAddress: deliveryAddress.trim(),
                        details: deliveryDetails.trim(),
                        label: selectedLabel
                      }
                    }
                  })
                }
              }}
              activeOpacity={0.5}
              style={styles(currentTheme).saveBtnContainer}>
              <TextDefault textColor={currentTheme.black} H5 bold>
                {i18n.t('saveContBtn')}
              </TextDefault>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <SearchModal
        visible={modalVisible}
        onClose={onClose}
        onSubmit={onSubmit}
      />
      <View
        style={{
          paddingBottom: inset.bottom,
          backgroundColor: currentTheme.themeBackground
        }}
      />
    </>
  )
}

export default NewAddress

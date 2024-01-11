import React, { useState, useContext } from 'react'
import { View, TouchableOpacity } from 'react-native'
import RadioButton from '../../../ui/FdRadioBtn/RadioBtn'
import ConfigurationContext from '../../../context/Configuration'
import ThemeContext from '../../../ui/ThemeContext/ThemeContext'
import CustomTheme from '../../../utils/themeColors1'
import styles from './styles'
import TextDefault from '../../Text/TextDefault/TextDefault'
import { alignment } from '../../../utils/alignment'

function RadioComponent(props) {
  const { theme } = CustomTheme()
  const [selected, setSelected] = useState(props.selected || null)
  const [options] = useState(props.options)
  const configuration = useContext(ConfigurationContext)
  const themeContext = useContext(ThemeContext)
  const currentTheme = theme[themeContext.ThemeValue]

  function onPress(option) {
    setSelected(option)
    props.onPress(option)
  }

  return (
    <View>
      {options.map(option => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress.bind(this, option)}
          key={option._id}
          style={styles.mainContainer}>
          <View style={styles.leftContainer}>
            <RadioButton
              size={13}
              outerColor={currentTheme.radioOuterColor}
              innerColor={currentTheme.radioColor}
              animation={'bounceIn'}
              isSelected={selected ? selected._id === option._id : false}
              onPress={onPress.bind(this, option)}
            />
            <TextDefault
              textColor={currentTheme.fontMainColor}
              style={alignment.MLsmall}
              H5
              bold>
              {option.title}
            </TextDefault>
          </View>
          <View style={styles.rightContainer}>
            <TextDefault
              textColor={currentTheme.fontMainColor}
              H5
              bold>{`${configuration.currencySymbol} ${option.price}`}</TextDefault>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default RadioComponent

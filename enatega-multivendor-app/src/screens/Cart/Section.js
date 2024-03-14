import { View, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native'
import React, { useContext } from 'react'
import TextDefault from '../../components/Text/TextDefault/TextDefault'
import { scale } from '../../utils/scaling'
import { food, relatedItems as relatedItemsQuery, restaurant as restaurantQuery } from '../../apollo/queries'
import { gql, useApolloClient, useQuery } from '@apollo/client'
import { alignment } from '../../utils/alignment'
import styles from './styles'
import ThemeContext from '../../ui/ThemeContext/ThemeContext'
import { theme } from '../../utils/themeColors'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import ConfigurationContext from '../../context/Configuration'

const RELATED_ITEMS = gql`${relatedItemsQuery}`
const RESTAURANT = gql`${restaurantQuery}`
const FOOD = gql`${food}`
const Section = ({ itemId, restaurantId }) => {
    console.log("Section Props:", itemId, restaurantId);
    const navigation = useNavigation()
    const client = useApolloClient()
    const themeContext = useContext(ThemeContext)
    const configuration = useContext(ConfigurationContext)
    const currentTheme = theme[themeContext.ThemeValue]
    const { loading, error, data } = useQuery(RELATED_ITEMS, { variables: { itemId, restaurantId } })
    if (loading) return <View />
    if (error) return <View />
    const { relatedItems } = data
    if (relatedItems.length < 1) return <View />
    const result = client.readQuery({ query: RESTAURANT, variables: { id: restaurantId } })
    const slicedItems = relatedItems.length > 3 ? relatedItems.slice(0, 3) : relatedItems
    const restaurant = result?.restaurant
    const renderItem = ({ item }) => {
        const food = client.readFragment({ id: `Food:${item}`, fragment: FOOD })
        console.log("food in section:", JSON.stringify(food, null, 3));
        const onAdd = () => {
            navigation.push('ItemDetail', {
                food: {
                    ...food,
                    restaurantName: restaurant.name
                },
                addons: restaurant.addons,
                options: restaurant.options,
                restaurant: restaurant._id
            })
        }
        return <View style={{ ...alignment.PRsmall }}>
            <View style={styles().suggestItemContainer}>
                {food.image &&
                    <View style={styles().suggestItemImgContainer}>
                        <Image
                            source={{ uri: food.image }}
                            style={styles().suggestItemImg}
                            resizeMode="contain"
                        />
                    </View>
                }
                <ScrollView>
                    <TextDefault
                        style={styles().suggestItemName}
                        textColor={currentTheme.fontFourthColor}
                        H5
                        bolder>
                        {food.title}
                    </TextDefault>
                    <TextDefault
                        style={styles().suggestItemDesciption}
                        textColor={currentTheme.secondaryText}
                        normal>
                        {food.description}
                    </TextDefault>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-end',
                            justifyContent: 'space-between'
                        }}>
                        <TextDefault
                            style={styles().suggestItemPrice}
                            textColor={currentTheme.fontFourthColor}
                            normal
                            bolder>
                            {`${configuration.currencySymbol}${food.variations[0].price}`}
                        </TextDefault>
                        <TouchableOpacity onPress={onAdd}>
                            <View style={styles().addToCart}>
                                <MaterialIcons name="add" size={scale(20)} color="#fff" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </View>
    }


    return (
        <View>
            <TextDefault
                style={styles().suggestItemDesciption}
                textColor={currentTheme.fontNewColor}
                H5
                bolder>
                Would you like to add these?
            </TextDefault>
            <FlatList
                data={slicedItems}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={{ flexGrow: 1, ...alignment.PRlarge }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                horizontal={true}
            />
        </View>
    )
}
export default Section
import { View, StatusBar, Text, TextInput, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';
import Fontisto from '@expo/vector-icons/Fontisto';
import Ionicons from '@expo/vector-icons/Ionicons';
import theme from '../../design-system/theme/theme';
import { verticalScale } from '../../design-system/theme/scaleUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFetchProducts } from '../../hooks/useFetchProducts';
import { Button } from 'react-native-paper';
import { SERVER_URL } from '../../constants/api';
import {db, collection, auth, addDoc, arrayUnion, serverTimestamp, increment, updateDoc, query, where, getDocs, getDoc, deleteDoc} from "../../Firebaseconfig";
import { useState } from 'react';




const HomeScreen=()=>{
    const insets = useSafeAreaInsets();
    const {data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage} = useFetchProducts();
    const products = data?.pages.flatMap(page => page.products);
    const [cartItems, setCartItems] = useState([]);

    const handleAddToCart = async (item)=>{
        try{
       const cartRef = collection(db, "Users", auth.currentUser.uid, "Cart");
       const q = query(cartRef, where("inventoryId", "==", item.id));
       const querySnapshot = await getDocs(q);

       if(!querySnapshot.empty){
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef,{
            quantity:increment(1),
        })
        const updatedDoc = await getDoc(docRef);

        setCartItems(prevState => ({
            ...prevState,
            [item.id]: updatedDoc.data().quantity, // Set the item.id as the key and updated quantity as value
        }));
        return  
       }

       await addDoc(cartRef,{
        inventoryId: item.id,
        priceAtAdd: item.price,
        quantity: increment(1),
        addedAt:serverTimestamp()
       });

       setCartItems(prevState => ({
        ...prevState,
        [item.id]: 1, // Set the item.id as the key and updated quantity as value
    }));
    } catch(e){
        console.log("error adding to cart", e);
    }
    }

    const handleRemoveCart = async (item) =>{
        try{
            const cartRef = collection(db, "Users", auth.currentUser.uid, "Cart");
            const q = query(cartRef, where("inventoryId", "==", item.id));
            const querySnapshot = await getDocs(q);
            if(!querySnapshot.empty){
                const docRef = querySnapshot.docs[0].ref;
                const currentQuantity = querySnapshot.docs[0].data().quantity;
                if(currentQuantity === 1){
                    await deleteDoc(docRef);
                    setCartItems(prevState => {
                        const { [item.id]: _, ...rest } = prevState; 
                        return rest;  
                    });
                    return
                }
                await updateDoc(docRef,{
                    quantity:currentQuantity -1,
                })
                const updatedDoc = await getDoc(docRef);
        
                setCartItems(prevState => ({
                    ...prevState,
                    [item.id]: updatedDoc.data().quantity, // Set the item.id as the key and updated quantity as value
                }));
                return  
               }
     
      
         } catch(e){
             console.log("error adding to cart", e);
         }

    }

    const renderItem=({item})=>{
        const isAdded = cartItems.hasOwnProperty(item.id);
        console.log(cartItems);
        if(item.type==="book"){
            return (
                <View style={{flexDirection:"row", gap:10, marginTop:theme.spacing.vertical.sm}}>
                    <View style={{backgroundColor:"lightgrey", padding:20, alignItems:"center"}}>
                        <Image 
                        source={{uri: item.coverImage}}
                        style={{ width: 150, height: 250, resizeMode: 'cover' }}
                        />
                    </View>
                    <View style={{flex:1, paddingRight:theme.spacing.horizontal.sm,justifyContent:"space-between", marginTop:theme.spacing.vertical.md}}>
                       <View>
                        <Text style={{color:theme.colors.text, fontWeight:"bold", fontSize:theme.fontSizes.medium}}>{item.title}</Text>
                        <Text style={{color:theme.colors.muted}}>by {item.author}</Text>
                        <View style={{flexDirection:"row", alignItems:"center"}}>
                        <Text style={{fontSize:theme.fontSizes.medium}}>₹</Text><Text style={{color:theme.colors.text, fontWeight:"bold", fontSize:theme.fontSizes.xl}}>{item.price}</Text>
                        </View>
                        </View>
                        <View style={{gap:10}}>
                            <Text style={{fontWeight:"bold"}}>In stock:{item.stock}</Text>
                            <Text>FREE delivery available</Text>
                            {isAdded ? (
                                <View style={{flexDirection:"row", paddingHorizontal:theme.spacing.horizontal.sm, paddingVertical:theme.spacing.vertical.xs, alignItems:"center", borderWidth:3, borderRadius:20, borderColor:theme.colors.primary, justifyContent:"space-between"}}>
                                {cartItems[item.id] === 1 ?(
                                <Ionicons name="trash-outline" size={20} color="black" onPress={()=>{handleRemoveCart(item)}} />
                                
                                ):(<Ionicons name="remove-sharp" size={24} color="black" onPress={()=>{handleRemoveCart(item)}} />)}
                                <Text style={{color:theme.colors.text, fontWeight:"bold"}}>{cartItems[item.id]}</Text>
                                <Ionicons name="add-sharp" size={20} color="black" onPress={()=>handleAddToCart(item)} />
                                </View>):(
                        <Button disabled={isAdded} mode="contained" onPress={()=>{handleAddToCart(item)}}> Add to Cart</Button>
                    )}
                        </View>
                    </View>
                </View>
            );
        }
        return null; // Return null for non-book items
    }

    if(isLoading){
        return(
            <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>
                <ActivityIndicator />
            </View>
        )
    }
return(

    <View style={{flex:1, backgroundColor:theme.colors.secondary}}>

    <View style={{paddingHorizontal:theme.spacing.horizontal.md, paddingTop:insets.top, paddingBottom:insets.bottom}}>
   <TextInput placeholder='Search a book' style={styles.input}
   placeholderTextColor={theme.colors.text}/>
   
    </View>
    <View style={{flex:1, backgroundColor:theme.colors.background}}>
       <FlatList
       data={products}
       renderItem={renderItem}
       keyExtractor={(item) => item.id}
       showsVerticalScrollIndicator={false}
       />
    </View>
    </View>
    
);
}

const styles = StyleSheet.create({
    input:{
        height:verticalScale(40),
        borderWidth:1,
        borderColor:"red",
        borderRadius:theme.borderRadius.md,
        paddingHorizontal:theme.spacing.horizontal.md,
    }
})

export default HomeScreen;
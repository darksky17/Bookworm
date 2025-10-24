import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddPhotosScreen from '../Screens/AddPhotosScreen';
import Tabnav from '../Tabnav';
import SignupScreen from '../Screens/SignupScreen';
import EditProfileScreen from '../Screens/EditProfileScreen';
import ChatDisplay from '../Screens/chatScreen';
import ViewProfile from '../Screens/ViewProfile';
import ChatScreenList from '../Screens/chatScreenList';
import AddAuthorsScreen from '../Screens/AddAuthorsScreen';
import AddGenresScreen from '../Screens/AddGenresScreen';
import AccountSettings from '../Screens/AccountSettings';
import PostDetailScreen from '../Screens/PostDetailScreen';
import AddPostScreen from '../Screens/AddPostScreen';
import EditPostScreen from '../Screens/EditPostScreen';
import DisplayProfileScreen from '../Screens/DisplayProfileScreen';
import ChatDisplay_new from '../Screens/chatScreen_new';
import SettingsScreen from '../Screens/SettingsScreen';
import SavedPosts from '../Screens/SavedPosts';
import BlockedUsersScreen from '../Screens/BlockedUsersScreen';
import NotificationScreen from '../Screens/NotificationScreen';
import useUnreadCountListener from "../hooks/useUnreadCountListener";
import useNotificationCountListener from '../hooks/useNotificationCountListener';
import ChatRequestsScreen from '../Screens/ChatRequestsScreen';
import StoreTabs from '../Screens/StoreScreens/StoreTabNav';
import HomeScreen from '../Screens/HomeScreen';


const MainStack = createNativeStackNavigator();

const MainNavigator = () => {
  // useUnreadCountListener();
  useNotificationCountListener();
  return (
    <MainStack.Navigator 
      screenOptions={{ headerShown: false, animation:"slide_from_right" }}
      initialRouteName={"MainTabs"}
    >
      
      <MainStack.Screen name="AddPhotos" component={AddPhotosScreen} />
      <MainStack.Screen name="MainTabs" component={Tabnav} />
      <MainStack.Screen name="StoreTabs" component={StoreTabs} />
      <MainStack.Screen name="Signup" component={SignupScreen} />
      <MainStack.Screen name="EditProfile" component={EditProfileScreen} />
      <MainStack.Screen name="ChatDisplay" component={ChatDisplay} />
      <MainStack.Screen name="ProfileDisplay" component={ViewProfile} />
      <MainStack.Screen name="ChatScreenList" component={ChatScreenList} />
      <MainStack.Screen name="AddAuthors" component={AddAuthorsScreen} />
      <MainStack.Screen name="AddGenres" component={AddGenresScreen} />
      <MainStack.Screen name="AccountSettings" component={AccountSettings} />
      <MainStack.Screen name="PostDetail" component={PostDetailScreen} />
      <MainStack.Screen name="AddPost" component={AddPostScreen} />
      <MainStack.Screen name="EditPost" component={EditPostScreen} />
      <MainStack.Screen name="DisplayProfile" component={DisplayProfileScreen} />
      <MainStack.Screen name="ChatDisplay_new" component={ChatDisplay_new} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
      <MainStack.Screen name="Saved" component={SavedPosts} />
      <MainStack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      <MainStack.Screen name="Notifications" component={NotificationScreen} />
      <MainStack.Screen name="ChatRequests" component={ChatRequestsScreen} />
    

    </MainStack.Navigator>
  );
};

export default MainNavigator;
import { useUser } from "@clerk/expo";
import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import { HOME_BALANCE, HOME_SUBSCRIPTIONS, UPCOMING_SUBSCRIPTIONS } from "@/constants/data";
import { icons } from "@/constants/icons";
import images from "@/constants/images";
import "@/global.css";
import { formatCurrency } from "@/lib/utils";
import { posthog } from "@/lib/posthog";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const HeaderLayout = ({ displayName, profileImageUrl, onAddPress }: { displayName: string; profileImageUrl: string | null; onAddPress: () => void }) => (
  <>
    <View className="home-header">
      <View className="home-user">
        <Image source={profileImageUrl ? { uri: profileImageUrl } : images.avatar} className="home-avatar" />
        <Text className="home-user-name">{displayName}</Text>
      </View>
      <Pressable className="home-add-icon-container" onPress={onAddPress}>
        <Image source={icons.add} className="home-add-icon" />
      </Pressable>
    </View>

    <View className="home-balance-card">
      <Text className="home-balance-label">Balance</Text>

      <View className="home-balance-row">
        <Text className="home-balance-amount">{formatCurrency(HOME_BALANCE.amount)}</Text>
        <Text className="home-balance-date">{dayjs(HOME_BALANCE.nextRenewalDate).format("MM/DD")}</Text>
      </View>
    </View>

    <View>
      <ListHeading title="Upcoming" />

      <FlatList
        data={UPCOMING_SUBSCRIPTIONS}
        renderItem={({ item }) => <UpcomingSubscriptionCard {...item} />}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        ListEmptyComponent={<Text>No upcoming renewals yet.</Text>}
      />
    </View>

    <ListHeading title="All Subscriptions" />
  </>
);

export default function App() {
  const { user, isLoaded } = useUser();
  const [expandedSubscriptionID, setExpandedSubscriptionID] = useState<string | null>(null);

  const displayName =
    user?.fullName?.trim() ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    "there";

  const profileImageUrl = user?.imageUrl;

  const handleAddPress = () => {
    posthog.capture("add_subscription_tapped");
    console.log("add button pressed");
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        ListHeaderComponent={
          <HeaderLayout
            displayName={isLoaded ? displayName : "…"}
            profileImageUrl={isLoaded ? profileImageUrl : null}
            onAddPress={handleAddPress}
          />
        }
        data={HOME_SUBSCRIPTIONS}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        extraData={expandedSubscriptionID}
        contentContainerClassName="pb-30"
        ItemSeparatorComponent={() => <View className="h-4" />}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionID === item.id}
            onPress={() => {
              const isExpanding = expandedSubscriptionID !== item.id;
              if (isExpanding) {
                posthog.capture("subscription_card_expanded", { subscription_id: item.id });
              }
              setExpandedSubscriptionID((currentId) =>
                currentId === item.id ? null : item.id,
              );
            }}
          />
        )}
      />
    </SafeAreaView>
  );
}

import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import { HOME_BALANCE, HOME_SUBSCRIPTIONS, HOME_USER, UPCOMING_SUBSCRIPTIONS } from "@/constants/data";
import { icons } from "@/constants/icons";
import images from "@/constants/images";
import "@/global.css";
import { formatCurrency } from "@/lib/utils";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import {useState} from "react";
const SafeAreaView = styled(RNSafeAreaView)

const HeaderLayout = () => (
    <>
        <View className="home-header">
            <View className="home-user">
                <Image source={images.avatar} className="home-avatar" />
                <Text className="home-user-name">{HOME_USER?.name ?? "John Doe"}</Text>
            </View>
            <Pressable className="home-add-icon-container" onPress={() => console.log('add button pressed')}>
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

            <FlatList data={UPCOMING_SUBSCRIPTIONS}

                      renderItem={({ item }) => (
                          <UpcomingSubscriptionCard {...item} />
                      )}

                      keyExtractor={(item) => item.id.toString()}
                      horizontal={true}
                      showsHorizontalScrollIndicator={false}
                      ListEmptyComponent={<Text>No upcoming renewals yet.</Text>}
            />
        </View>

        <ListHeading title="All Subscriptions" />
    </>
)

export default function App() {
    const [expandedSubscriptionID, setExpandedSubscriptionID] = useState<string | null>(null)
    return (
        <SafeAreaView className="flex-1 bg-background p-5">

                <FlatList
                    ListHeaderComponent={<HeaderLayout />}

                    data={HOME_SUBSCRIPTIONS}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    extraData={expandedSubscriptionID}
                    contentContainerClassName='pb-30'
                    ItemSeparatorComponent={() => <View className="h-4" />}
                    renderItem={({ item }) => (
                        <SubscriptionCard
                            {...item}
                            expanded={expandedSubscriptionID === item.id}
                            onPress={() =>
                                setExpandedSubscriptionID((currentId) =>
                                    currentId === item.id ? null : item.id
                                )
                            }
                        />
                    )}
                />
        </SafeAreaView>
    );
}
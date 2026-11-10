/** Go back when this screen was pushed, otherwise return to its role's root screen. */
export function safeBack(navigation, fallbackRoute) {
  if (navigation.canGoBack()) navigation.goBack();
  else navigation.navigate(fallbackRoute);
}

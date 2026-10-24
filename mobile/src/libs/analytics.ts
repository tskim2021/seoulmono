import GA from '@react-native-firebase/analytics';

const logEvent = ({
  eventName,
  params,
}: {
  eventName: string;
  params: Record<string, any>;
}) => {
  GA().logEvent(eventName, params);
};

export const analytics = {
  logEvent,
};

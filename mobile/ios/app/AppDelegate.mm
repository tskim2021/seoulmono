#import "AppDelegate.h"

#import <React/RCTLinkingManager.h>
#import <React/RCTBundleURLProvider.h>

#import "RNSplashScreen.h"
#import <Firebase.h>
#import "RNFBMessagingModule.h"

#import <RNKakaoLogins.h>
#import <NaverThirdPartyLogin/NaverThirdPartyLoginConnection.h>
#import <GoogleSignIn/GoogleSignIn.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"app";
  self.initialProps = [RNFBMessagingModule addCustomPropsToUserProps:nil withLaunchOptions:launchOptions];

  [FIRApp configure];

  bool didFinish = [super application:application didFinishLaunchingWithOptions:launchOptions];
  
  [RNSplashScreen show];
  return didFinish;
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options 
{
  // カカオログインのコールバック
  // kakaoccbab6acbcafedded697719354226809:// スキームで始まるURL
  if ([RNKakaoLogins isKakaoTalkLoginUrl:url]) {
    return [RNKakaoLogins handleOpenUrl:url];
  }

  // NAVERログインのコールバック
  // Info.plist の CFBundleURLSchemes に登録された "seoulmono" スキームを使用
  // (config.ts serviceUrlSchemeIOS: 'seoulmono' と一致している必要がある)
  if ([url.scheme isEqualToString:@"seoulmono"]) {
    return [[NaverThirdPartyLoginConnection getSharedInstance] application:app openURL:url options:options];
  }

  // Googleログインのコールバック
  if ([GIDSignIn.sharedInstance handleURL:url]) {
    return YES;
  }

  if ([RCTLinkingManager application:app openURL:url options:options]) {
    return YES;
  }

  return NO;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end

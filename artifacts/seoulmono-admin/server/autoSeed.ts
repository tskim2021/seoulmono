import { drizzle } from "drizzle-orm/mysql2";
  import { sql, eq } from "drizzle-orm";
  import { categories, products, boards, posts, users, searchKeywords, siteSettings, paymentMethods, shippingCarriers } from "../drizzle/schema";
  import bcrypt from "bcryptjs";

  interface ScrapedProduct {
    category: string;
    itemId: string;
    title: string;
    subtitle: string;
    price: number;
    originalPrice: number | null;
    discount: number | null;
    imageUrl: string;
  }

  const seedData: ScrapedProduct[] = [{"category":"탈모헤어","itemId":"1728190784","title":"두타놀0.5 Dutanol0.5 두타스테리드 0.5mg x 300정 크놀헬스케어","subtitle":"","price":50000,"originalPrice":79620,"discount":37,"imageUrl":"https://talmoschool.com/data/item/1728190784/1728190784.jpg"},{"category":"탈모헤어","itemId":"1728190768","title":"F페시아 F-pesia 피나스테리드 1mg x 300정 시플라","subtitle":"","price":67000,"originalPrice":74630,"discount":10,"imageUrl":"https://talmoschool.com/data/item/1728190768/1728190768.jpg"},{"category":"탈모헤어","itemId":"1728659911","title":"미녹시탑5 MinoxyTop5 미녹시딜 5% 60ML x 6박스 Zeelab","subtitle":"","price":101000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728659911/1728659911.jpg"},{"category":"탈모헤어","itemId":"1728659619","title":"미녹시탑10 MinoxyTop10 미녹시딜 10% 60ML x 6박스 ZEE","subtitle":"","price":116000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728659619/1728659619.jpg"},{"category":"탈모헤어","itemId":"1728472645","title":"피낙스 FINAX 피나스테리드 1mg x 600정 닥터레디스","subtitle":"","price":143000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728472645/1728472645.jpg"},{"category":"탈모헤어","itemId":"1728471936","title":"힐페시아 Healpecia 피나스테리드 1mg x 300정 힐링파마","subtitle":"","price":57000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728471936/1728471936.jpg"},{"category":"탈모헤어","itemId":"1728471889","title":"힐페시아 Healpecia 피나스테리드 1mg x 200정 힐링파마","subtitle":"","price":47000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728471889/1728471889.jpg"},{"category":"탈모헤어","itemId":"1728464064","title":"두프로스트 Duprost 두타스테리드 0.5mg x 300정 시플라","subtitle":"","price":201000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728464064/1728464064.jpg"},{"category":"탈모헤어","itemId":"1728463997","title":"두프로스트 Duprost 두타스테리드 0.5mg x 200정 시플라","subtitle":"","price":141000,"originalPrice":195135,"discount":28,"imageUrl":"https://talmoschool.com/data/item/1728463997/1728463997.jpg"},{"category":"탈모헤어","itemId":"1728463762","title":"아보스테리드 Avosteride 두타스테리드0.5mg x 300정 Signature Pharma","subtitle":"","price":70000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728463762/1728463762.jpg"},{"category":"탈모헤어","itemId":"1728463397","title":"두타힐0.5mg DUTAHEAL0.5mg 두타스테리드 0.5mg x 200정 힐링파마","subtitle":"","price":36000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728463397/1728463397.jpg"},{"category":"탈모헤어","itemId":"1728463349","title":"두타힐0.5mg DUTAHEAL0.5mg 두타스테리드 0.5mg x 300정 힐링파마","subtitle":"","price":45000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728463349/1728463349.jpg"},{"category":"탈모헤어","itemId":"1728462626","title":"시그페시아 SIGPECIA 피나스테리드 1mg x 300정 햅파마","subtitle":"","price":65000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728462626/1728462626.jpg"},{"category":"탈모헤어","itemId":"1728462587","title":"시그페시아 SIGPECIA 피나스테리드 1mg x 200정 햅파마","subtitle":"","price":47000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728462587/1728462587.jpg"},{"category":"탈모헤어","itemId":"1728461858","title":"민프로10 Minpro10 미녹시딜 10mg x 600정 Jeerima","subtitle":"","price":115000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728461858/1728461858.jpg"},{"category":"탈모헤어","itemId":"1728457076","title":"두타스 Dutas 두타스테리드0.5mg x 300정 Dr. Reddy’s","subtitle":"","price":227000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728457076/1728457076.jpg"},{"category":"탈모헤어","itemId":"1728456161","title":"투게인10 Tugain10 바르는 미녹시딜 10% 60ML x 6박스 시플라","subtitle":"","price":153000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728456161/1728456161.jpg"},{"category":"탈모헤어","itemId":"1728455840","title":"투게인5 Tugain5 분무형 미녹시딜 5% 60ML x 6박스 시플라","subtitle":"","price":131000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728455840/1728455840.jpg"},{"category":"탈모헤어","itemId":"1728455517","title":"투게인2 Tugain2 여성용 미녹시딜 2% 60ML x 6박스 시플라","subtitle":"","price":92000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728455517/1728455517.jpg"},{"category":"탈모헤어","itemId":"1728453582","title":"모르2 MORR10 미녹시딜 2% 60ML x 6박스 인타스","subtitle":"","price":78000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728453582/1728453582.jpg"},{"category":"탈모헤어","itemId":"1728447201","title":"모르5 MORR5 미녹시딜 5% 60ML x 6박스 인타스","subtitle":"","price":113000,"originalPrice":85433,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728447201/1728447201.jpg"},{"category":"탈모헤어","itemId":"1728446316","title":"모르10 MORR10 미녹시딜 10% 60ML x 6박스 인타스","subtitle":"","price":140000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728446316/1728446316.jpg"},{"category":"탈모헤어","itemId":"1728190821","title":"HAIR 4U F 5% 180ml","subtitle":"","price":89588,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190821/1728190821.jpg"},{"category":"탈모헤어","itemId":"1728190820","title":"모르10 MORR10 미녹시딜 10% 60ML x 3박스 인타스","subtitle":"","price":80000,"originalPrice":97898,"discount":18,"imageUrl":"https://talmoschool.com/data/item/1728190820/1728190820.jpg"},{"category":"탈모헤어","itemId":"1728190819","title":"MORR 12.5% 180ml","subtitle":"","price":112025,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190819/1728190819.jpg"},{"category":"탈모헤어","itemId":"1728190818","title":"모르2 MORR10 미녹시딜 2% 60ML x 3박스 인타스","subtitle":"","price":51000,"originalPrice":65905,"discount":23,"imageUrl":"https://talmoschool.com/data/item/1728190818/1728190818.jpg"},{"category":"탈모헤어","itemId":"1728190817","title":"MORR 3% 180ml","subtitle":"","price":77123,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190817/1728190817.jpg"},{"category":"탈모헤어","itemId":"1728190816","title":"모르5 MORR5 미녹시딜 10% 60ML x 3박스 인타스","subtitle":"","price":69000,"originalPrice":85433,"discount":19,"imageUrl":"https://talmoschool.com/data/item/1728190816/1728190816.jpg"},{"category":"탈모헤어","itemId":"1728190815","title":"MORR 7.5% 180ml","subtitle":"","price":94574,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190815/1728190815.jpg"},{"category":"탈모헤어","itemId":"1728190807","title":"미녹시탑 10% 180ml","subtitle":"","price":78785,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190807/1728190807.jpg"},{"category":"탈모헤어","itemId":"1728190806","title":"미녹시탑10 MinoxyTop10 미녹시딜 10% 60ML x 3박스 ZEE","subtitle":"","price":74000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190806/1728190806.jpg"},{"category":"탈모헤어","itemId":"1728190805","title":"미녹시탑 10% 360ml","subtitle":"","price":99560,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190805/1728190805.jpg"},{"category":"탈모헤어","itemId":"1728190804","title":"미녹시탑 5% 180ml","subtitle":"","price":70475,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190804/1728190804.jpg"},{"category":"탈모헤어","itemId":"1728190801","title":"미녹시탑F 5% 180ml","subtitle":"","price":74630,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190801/1728190801.jpg"},{"category":"탈모헤어","itemId":"1728190796","title":"투게인10 Tugain10 바르는 미녹시딜 10% 60ML x 3박스 시플라","subtitle":"","price":94000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190796/1728190796.jpg"},{"category":"탈모헤어","itemId":"1728190795","title":"투게인2 Tugain2 여성용 미녹시딜 2% 60ML x 3박스 시플라","subtitle":"","price":63000,"originalPrice":65935,"discount":4,"imageUrl":"https://talmoschool.com/data/item/1728190795/1728190795.jpg"},{"category":"탈모헤어","itemId":"1728190794","title":"투게인5 Tugain5 분무형 미녹시딜 5% 60ML x 3박스 시플라","subtitle":"","price":68000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190794/1728190794.jpg"},{"category":"탈모헤어","itemId":"1728190790","title":"미녹시분10 600정","subtitle":"","price":141110,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190790/1728190790.jpg"},{"category":"탈모헤어","itemId":"1728190789","title":"미녹시분2.5 600정","subtitle":"","price":91250,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190789/1728190789.jpg"},{"category":"탈모헤어","itemId":"1728190788","title":"미녹시분5 600정","subtitle":"","price":99565,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190788/1728190788.jpg"},{"category":"탈모헤어","itemId":"1728190785","title":"두타놀0.5 Dutanol0.5 두타스테리드 0.5mg x 600정 크놀헬스케어","subtitle":"","price":72000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190785/1728190785.jpg"},{"category":"탈모헤어","itemId":"1728190783","title":"두타스 Dutas 두타스테리드 0.5mg x 150정 Dr. Reddy’s","subtitle":"","price":127000,"originalPrice":229750,"discount":45,"imageUrl":"https://talmoschool.com/data/item/1728190783/1728190783.jpg"},{"category":"탈모헤어","itemId":"1728190782","title":"두타힐0.5mg DUTAHEAL0.5mg 두타스테리드 0.5mg x 100정 힐링파마","subtitle":"","price":28000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190782/1728190782.jpg"},{"category":"탈모헤어","itemId":"1728190780","title":"두프로스트 Duprost 두타스테리드 0.5mg x 100정 시플라","subtitle":"","price":82000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190780/1728190780.jpg"},{"category":"탈모헤어","itemId":"1728190778","title":"베르트리드 600정","subtitle":"","price":274075,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190778/1728190778.jpg"},{"category":"탈모헤어","itemId":"1728190777","title":"아보스테리드 Avosteride 두타스테리드 0.5mg x 100정 Signature Pharma","subtitle":"","price":45000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190777/1728190777.jpg"},{"category":"탈모헤어","itemId":"1728190776","title":"HAIR 4U F 5% 180ml","subtitle":"","price":89588,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190776/1728190776.jpg"},{"category":"탈모헤어","itemId":"1728190769","title":"시그페시아 SIGPECIA 피나스테리드 1mg x 100정 햅파마","subtitle":"","price":30000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190769/1728190769.jpg"},{"category":"탈모헤어","itemId":"1728190767","title":"F페시아 F-pesia 피나스테리드 1mg x 600정 시플라","subtitle":"","price":96000,"originalPrice":99560,"discount":4,"imageUrl":"https://talmoschool.com/data/item/1728190767/1728190767.jpg"},{"category":"탈모헤어","itemId":"1728190766","title":"프로스칼핀 Poscalpin 피나스테리드 1mg x 100정 포춘헬스케어","subtitle":"","price":27000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190766/1728190766.jpg"},{"category":"탈모헤어","itemId":"1728190765","title":"프로스칼핀 Poscalpin 피나스테리드 1mg x 200정 포춘헬스케어","subtitle":"","price":47000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190765/1728190765.jpg"},{"category":"탈모헤어","itemId":"1728190764","title":"프로스케어 300정","subtitle":"","price":66370,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190764/1728190764.jpg"},{"category":"탈모헤어","itemId":"1728190763","title":"피날로 FINALO 피나스테리드 1mg x 300정 인타스","subtitle":"","price":65000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190763/1728190763.jpg"},{"category":"탈모헤어","itemId":"1728190762","title":"피날로 FINALO 피나스테리드 1mg x 600정 인타스","subtitle":"","price":105000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190762/1728190762.jpg"},{"category":"탈모헤어","itemId":"1728190760","title":"피낙스 FINAX 피나스테리드 1mg x 300정 닥터레디스","subtitle":"","price":85000,"originalPrice":114338,"discount":26,"imageUrl":"https://talmoschool.com/data/item/1728190760/1728190760.jpg"},{"category":"탈모헤어","itemId":"1728190759","title":"핀레스트1mg 300정","subtitle":"","price":64660,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190759/1728190759.jpg"},{"category":"탈모헤어","itemId":"1728190758","title":"핀레스트1mg 600정","subtitle":"","price":79618,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190758/1728190758.jpg"},{"category":"탈모헤어","itemId":"1728190757","title":"핀카 300정","subtitle":"","price":153580,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190757/1728190757.jpg"},{"category":"탈모헤어","itemId":"1728190756","title":"핀카 600정","subtitle":"","price":257450,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190756/1728190756.jpg"},{"category":"탈모헤어","itemId":"1728190755","title":"핀페시아 Finpesia 피나스테리드 1mg x 300정 시플라","subtitle":"","price":80000,"originalPrice":89785,"discount":11,"imageUrl":"https://talmoschool.com/data/item/1728190755/1728190755.jpg"},{"category":"탈모헤어","itemId":"1728190753","title":"핀페시아 Finpesia 피나스테리드 1mg x 600정 시플라","subtitle":"","price":131000,"originalPrice":142800,"discount":8,"imageUrl":"https://talmoschool.com/data/item/1728190753/1728190753.jpg"},{"category":"탈모헤어","itemId":"1728190752","title":"힐페시아 Healpecia 피나스테리드 1mg x 100정 힐링파마","subtitle":"","price":27000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190752/1728190752.jpg"},{"category":"탈모헤어","itemId":"1728190751","title":"힐페시아5 300정","subtitle":"","price":78785,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190751/1728190751.jpg"},{"category":"탈모헤어","itemId":"1728190750","title":"힐페시아5 300정","subtitle":"","price":78785,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190750/1728190750.jpg"},{"category":"탈모헤어","itemId":"1728190749","title":"프로스칼핀 Poscalpin 피나스테리드 1mg x 300정 포춘헬스케어","subtitle":"","price":57000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190749/1728190749.jpg"},{"category":"탈모헤어","itemId":"1728190746","title":"아보스테리드 Avosteride 두타스테리드 0.5mg x 200정 Signature Pharma","subtitle":"","price":65000,"originalPrice":79062,"discount":18,"imageUrl":"https://talmoschool.com/data/item/1728190746/1728190746.jpg"},{"category":"탈모헤어","itemId":"1728190745","title":"두타놀0.5 Dutanol0.5 두타스테리드 0.5mg x 400정 크놀헬스케어","subtitle":"","price":56000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190745/1728190745.jpg"},{"category":"탈모헤어","itemId":"1728455104","title":"민탑2 Mintop2 미녹시딜2% 60ML x 6 박스 Dr.Reddy's","subtitle":"","price":83000,"originalPrice":69229,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728455104/1728455104.jpg"},{"category":"탈모헤어","itemId":"1728454782","title":"민탑5 Mintop5 미녹시딜5% 60ML x 6 박스 Dr.Reddy's","subtitle":"","price":145000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728454782/1728454782.jpg"},{"category":"탈모헤어","itemId":"1728454432","title":"민탑10 Mintop10 미녹시딜10% 60ML x 6 박스 Dr.Reddy's","subtitle":"","price":155000,"originalPrice":114103,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728454432/1728454432.jpg"},{"category":"탈모헤어","itemId":"1728190814","title":"MORR F 10% 180ml","subtitle":"","price":107455,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190814/1728190814.jpg"},{"category":"탈모헤어","itemId":"1728190813","title":"MORR F 3% 180ml","subtitle":"","price":77539,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190813/1728190813.jpg"},{"category":"탈모헤어","itemId":"1728190812","title":"MORR F 5% 180ml","subtitle":"","price":92497,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190812/1728190812.jpg"},{"category":"탈모헤어","itemId":"1728190811","title":"미녹시큐어 10% 180ml","subtitle":"","price":78785,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190811/1728190811.jpg"},{"category":"탈모헤어","itemId":"1728190810","title":"미녹시큐어 2% 180ml","subtitle":"","price":70475,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190810/1728190810.jpg"},{"category":"탈모헤어","itemId":"1728190809","title":"미녹시큐어 5% 180ml","subtitle":"","price":70475,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190809/1728190809.jpg"},{"category":"탈모헤어","itemId":"1728190808","title":"미녹시큐어F 5% 180ml","subtitle":"","price":95405,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190808/1728190808.jpg"},{"category":"탈모헤어","itemId":"1728190803","title":"미녹시탑5 MinoxyTop5 미녹시딜 5% 60ML x 3박스 Zeelab","subtitle":"","price":61000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190803/1728190803.jpg"},{"category":"탈모헤어","itemId":"1728190802","title":"미녹시탑 5% 360ml","subtitle":"","price":87095,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190802/1728190802.jpg"},{"category":"탈모헤어","itemId":"1728190800","title":"미녹시탑F 5% 360ml","subtitle":"","price":95405,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190800/1728190800.jpg"},{"category":"탈모헤어","itemId":"1728190799","title":"민탑10 Mintop10 미녹시딜10% 60ML x 3박스 Dr.Reddy's","subtitle":"","price":95000,"originalPrice":114103,"discount":17,"imageUrl":"https://talmoschool.com/data/item/1728190799/1728190799.jpg"},{"category":"탈모헤어","itemId":"1728190798","title":"민탑2 Mintop2 미녹시딜2% 60ML x 3박스 Dr.Reddy's","subtitle":"","price":54000,"originalPrice":69229,"discount":22,"imageUrl":"https://talmoschool.com/data/item/1728190798/1728190798.jpg"},{"category":"탈모헤어","itemId":"1728190797","title":"민탑5 Mintop5 미녹시딜5% 60ML x 3박스 Dr.Reddy's","subtitle":"","price":82000,"originalPrice":98730,"discount":17,"imageUrl":"https://talmoschool.com/data/item/1728190797/1728190797.jpg"},{"category":"탈모헤어","itemId":"1728190793","title":"틴팔5% 60ml","subtitle":"","price":95415,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190793/1728190793.jpg"},{"category":"탈모헤어","itemId":"1728190792","title":"로니탭10 120정","subtitle":"","price":164378,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190792/1728190792.jpg"},{"category":"탈모헤어","itemId":"1728190791","title":"로니탭5 180정","subtitle":"","price":174350,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190791/1728190791.jpg"},{"category":"탈모헤어","itemId":"1728190787","title":"민프로10 Minpro10 미녹시딜 10mg x 300정 Jeerima","subtitle":"","price":76000,"originalPrice":132800,"discount":43,"imageUrl":"https://talmoschool.com/data/item/1728190787/1728190787.jpg"},{"category":"탈모헤어","itemId":"1728190781","title":"두프로 500정","subtitle":"","price":84322,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190781/1728190781.jpg"},{"category":"탈모헤어","itemId":"1728190779","title":"베르트리드 300정","subtitle":"","price":161890,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190779/1728190779.jpg"},{"category":"탈모헤어","itemId":"1728190775","title":"MORR F 10% 180ml","subtitle":"","price":107455,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190775/1728190775.jpg"},{"category":"탈모헤어","itemId":"1728190774","title":"MORR F 3% 180ml","subtitle":"","price":77539,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190774/1728190774.jpg"},{"category":"탈모헤어","itemId":"1728190773","title":"MORR F 5% 180ml","subtitle":"","price":92497,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190773/1728190773.jpg"},{"category":"탈모헤어","itemId":"1728190772","title":"미녹시큐어F 5% 180ml","subtitle":"","price":95405,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190772/1728190772.jpg"},{"category":"탈모헤어","itemId":"1728190771","title":"미녹시탑F 5% 180ml","subtitle":"","price":74630,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190771/1728190771.jpg"},{"category":"탈모헤어","itemId":"1728190770","title":"미녹시탑F 5% 360ml","subtitle":"","price":95405,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190770/1728190770.jpg"},{"category":"탈모헤어","itemId":"1728190761","title":"피나스트 300정","subtitle":"","price":188250,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728190761/1728190761.jpg"},{"category":"성기능","itemId":"1728193119","title":"카마그라 오랄젤리 Kamagra OralJelly 실데나필100mg x 70포(10박스) 아잔타파마","subtitle":"","price":101000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193119/1728193119.jpg"},{"category":"성기능","itemId":"1728193117","title":"센포스D CenforceD 복합성분 x 200정 센츄리온","subtitle":"","price":126000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193117/1728193117.jpg"},{"category":"성기능","itemId":"1728193116","title":"비달리스타20 Vidalista20 타다라필 20mg x 200정 센츄리온","subtitle":"","price":93000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193116/1728193116.jpg"},{"category":"성기능","itemId":"1728193115","title":"센포스100 Cenforce100 실데나필 100mg x 100정 센츄리온","subtitle":"","price":62000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193115/1728193115.jpg"},{"category":"성기능","itemId":"1728193114","title":"비달리스타5 Vidalista5 타다라필 5mg x 200정 센츄리온","subtitle":"","price":81000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193114/1728193114.jpg"},{"category":"성기능","itemId":"1728695404","title":"센포스120 Cenforce120 실데나필 120mg x 300정 센츄리온","subtitle":"","price":145000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728695404/1728695404.jpg"},{"category":"성기능","itemId":"1728695370","title":"센포스120 Cenforce120 실데나필 120mg x 200정 센츄리온","subtitle":"","price":107000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728695370/1728695370.jpg"},{"category":"성기능","itemId":"1728694995","title":"센포스150 Cenforce150 실데나필 150mg x 300정 센츄리온","subtitle":"","price":149000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728694995/1728694995.jpg"},{"category":"성기능","itemId":"1728694935","title":"센포스150 Cenforce150 실데나필 150mg x 200정 센츄리온","subtitle":"","price":109000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728694935/1728694935.jpg"},{"category":"성기능","itemId":"1728663831","title":"비달리스타40 Vidalista40 타다라필40mg x 300정 센츄리온","subtitle":"","price":125000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728663831/1728663831.jpg"},{"category":"성기능","itemId":"1728663758","title":"비달리스타40 Vidalista40 타다라필40mg x 200정 센츄리온","subtitle":"","price":95000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728663758/1728663758.jpg"},{"category":"성기능","itemId":"1728662136","title":"비달리스타10 Vidalista10 타다라필10mg x 300정 센츄리온","subtitle":"","price":119000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728662136/1728662136.jpg"},{"category":"성기능","itemId":"1728662105","title":"비달리스타10 Vidalista10 타다라필10mg x 200정 센츄리온","subtitle":"","price":89000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728662105/1728662105.jpg"},{"category":"성기능","itemId":"1728661820","title":"비달리스타80 Vidalista80 타다라필80mg x 300정 센츄리온","subtitle":"","price":133000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728661820/1728661820.jpg"},{"category":"성기능","itemId":"1728661792","title":"비달리스타80 Vidalista80 타다라필80mg x 200정 센츄리온","subtitle":"","price":101000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728661792/1728661792.jpg"},{"category":"성기능","itemId":"1728661563","title":"비달리스타60 Vidalista60 타다라필 60mg x 300정 센츄리온","subtitle":"","price":129000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728661563/1728661563.jpg"},{"category":"성기능","itemId":"1728661507","title":"비달리스타60 Vidalista60 타다라필 60mg x 200정 센츄리온","subtitle":"","price":99000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728661507/1728661507.jpg"},{"category":"성기능","itemId":"1728563136","title":"센포스 프로페셔널 Cenforce Professional 실데나필 100mg x 300정 센츄리온","subtitle":"","price":127000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728563136/1728563136.jpg"},{"category":"성기능","itemId":"1728563108","title":"센포스 프로페셔널 Cenforce Professional 실데나필 100mg x 200정 센츄리온","subtitle":"","price":97000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728563108/1728563108.jpg"},{"category":"성기능","itemId":"1728562782","title":"타다라이즈 프로페셔널 Tadarise professional 타다라필 40mg x 300정 선라이즈","subtitle":"","price":121000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728562782/1728562782.jpg"},{"category":"성기능","itemId":"1728562729","title":"타다라이즈 프로페셔널 Tadarise professional 타다라필 40mg x 200정 선라이즈","subtitle":"","price":101000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728562729/1728562729.jpg"},{"category":"성기능","itemId":"1728562121","title":"비달리스타CT 츄어블 Vidalista CT chewable 타다라필20mg x 300정 센츄리온","subtitle":"","price":126000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728562121/1728562121.jpg"},{"category":"성기능","itemId":"1728562094","title":"비달리스타CT 츄어블 Vidalista CT chewable 타다라필20mg x 200정 센츄리온","subtitle":"","price":96000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728562094/1728562094.jpg"},{"category":"성기능","itemId":"1728561324","title":"앱칼리스 오랄젤리 Apcalis-sx Oral Jelly 타다라필20mg x 105포(15박스) 아잔타파마","subtitle":"","price":126000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728561324/1728561324.jpg"},{"category":"성기능","itemId":"1728561282","title":"앱칼리스 오랄젤리 Apcalis-sx Oral Jelly 타다라필20mg x 70포(10박스) 아잔타파마","subtitle":"","price":96000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728561282/1728561282.jpg"},{"category":"성기능","itemId":"1728560270","title":"센포스 소프트 츄어블 Cenforce Soft chewable 실데나필100mg x 300정 센츄리온","subtitle":"","price":127000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728560270/1728560270.jpg"},{"category":"성기능","itemId":"1728560240","title":"센포스 소프트 츄어블 Cenforce Soft chewable 실데나필100mg x 200정 센츄리온","subtitle":"","price":97000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728560240/1728560240.jpg"},{"category":"성기능","itemId":"1728559537","title":"카마그라 발포정 Kamagra Effeverscent 실데나필 100mg x 210정 아잔타파마","subtitle":"","price":149000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728559537/1728559537.jpg"},{"category":"성기능","itemId":"1728559483","title":"카마그라 발포정 Kamagra Effeverscent 실데나필 100mg x 140정 아잔타파마","subtitle":"","price":110000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728559483/1728559483.jpg"},{"category":"성기능","itemId":"1728558478","title":"비달리스타2.5 Vidalista2.5 타다라필 2.5mg x 600정 센츄리온","subtitle":"","price":156000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728558478/1728558478.jpg"},{"category":"성기능","itemId":"1728557911","title":"비달리스타 프로 Vidalista Pro 타다라필 20mg x 300정 센츄리온","subtitle":"","price":149000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728557911/1728557911.jpg"},{"category":"성기능","itemId":"1728557858","title":"비달리스타 프로 Vidalista Pro 타다라필 20mg x 200정 센츄리온","subtitle":"","price":114000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728557858/1728557858.jpg"},{"category":"성기능","itemId":"1728557189","title":"센포스200 Cenforce200 실데나필200mg x 300정 센츄리온","subtitle":"","price":159000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728557189/1728557189.jpg"},{"category":"성기능","itemId":"1728557144","title":"센포스200 Cenforce200 실데나필200mg x 200정 센츄리온","subtitle":"","price":119000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728557144/1728557144.jpg"},{"category":"성기능","itemId":"1728555396","title":"타다칩 Tadacip 타다라필20mg x 120정 시플라","subtitle":"","price":105000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728555396/1728555396.jpg"},{"category":"성기능","itemId":"1728555320","title":"타다칩 Tadacip 타다라필20mg x 80정 시플라","subtitle":"","price":75000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728555320/1728555320.jpg"},{"category":"성기능","itemId":"1728554341","title":"하이포스50 ODS Highforce50 ODS 실데나필 50mg x 100매 힐링파마","subtitle":"","price":94000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728554341/1728554341.jpg"},{"category":"성기능","itemId":"1728553796","title":"센포스FM 여성용 Cenforce FM 실데나필100mg x 50정 센츄리온","subtitle":"","price":24000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728553796/1728553796.jpg"},{"category":"성기능","itemId":"1728480378","title":"카마그라골드 Kamagra Gold 실데나필100mg x 120정 아잔타파마","subtitle":"","price":122000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728480378/1728480378.jpg"},{"category":"성기능","itemId":"1728480346","title":"카마그라골드 Kamagra Gold 실데나필100mg x 80정 아잔타파마","subtitle":"","price":92000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728480346/1728480346.jpg"},{"category":"성기능","itemId":"1728480071","title":"카마그라골드 Kamagra Gold 실데나필50mg x 120정 아잔타파마","subtitle":"","price":112000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728480071/1728480071.jpg"},{"category":"성기능","itemId":"1728479966","title":"카마그라골드 Kamagra Gold 실데나필50mg x 80정 아잔타파마","subtitle":"","price":82000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728479966/1728479966.jpg"},{"category":"성기능","itemId":"1728479354","title":"센포스25 Cenforce25 실데나필25mg x 300정 센츄리온","subtitle":"","price":102000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728479354/1728479354.jpg"},{"category":"성기능","itemId":"1728479327","title":"센포스25 Cenforce25 실데나필25mg x 200정 센츄리온","subtitle":"","price":82000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728479327/1728479327.jpg"},{"category":"성기능","itemId":"1728478938","title":"슈퍼카마그라 SUPER KAMAGRA 복합ED x 120정 아잔타파마","subtitle":"","price":121000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728478938/1728478938.jpg"},{"category":"성기능","itemId":"1728478901","title":"슈퍼카마그라 SUPER KAMAGRA 복합ED x 80정 아잔타파마","subtitle":"","price":91000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728478901/1728478901.jpg"},{"category":"성기능","itemId":"1728478513","title":"슈퍼타다라이즈 Super TADARISE 복합ED x 300정 선라이즈","subtitle":"","price":181000,"originalPrice":98280,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728478513/1728478513.jpg"},{"category":"성기능","itemId":"1728478476","title":"슈퍼타다라이즈 Super TADARISE 복합ED x 200정 선라이즈","subtitle":"","price":131000,"originalPrice":98280,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728478476/1728478476.jpg"},{"category":"성기능","itemId":"1728477797","title":"카마그라 오랄젤리 Kamagra OralJelly 실데나필100mg x 140포(20박스) 아잔타파마","subtitle":"","price":176000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728477797/1728477797.jpg"},{"category":"성기능","itemId":"1728477646","title":"카마그라 오랄젤리 Kamagra OralJelly 실데나필100mg x 105포(15박스) 아잔타파마","subtitle":"","price":141000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728477646/1728477646.jpg"},{"category":"성기능","itemId":"1728476917","title":"센포스100 Cenforce100 실데나필100mg x 300정 센츄리온","subtitle":"","price":122000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728476917/1728476917.jpg"},{"category":"성기능","itemId":"1728476129","title":"비달리스타20 Vidalista20 타다라필20mg x 300정 센츄리온","subtitle":"","price":123000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728476129/1728476129.jpg"},{"category":"성기능","itemId":"1728475596","title":"슈퍼비달리스타 Super Vidalista 타다라필20mg x 300정 센츄리온","subtitle":"","price":151000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728475596/1728475596.jpg"},{"category":"성기능","itemId":"1728475515","title":"슈퍼비달리스타 Super Vidalista 타다라필20mg x 200정 센츄리온","subtitle":"","price":111000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728475515/1728475515.jpg"},{"category":"성기능","itemId":"1728475188","title":"센포스50 Cenforce50 실데나필50mg x 300정 센츄리온","subtitle":"","price":117000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728475188/1728475188.jpg"},{"category":"성기능","itemId":"1728475144","title":"센포스50 Cenforce50 실데나필50mg x 200정 센츄리온","subtitle":"","price":87000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728475144/1728475144.jpg"},{"category":"성기능","itemId":"1728474686","title":"수하그라 Suhagra 실데나필 100mg x 120정 시플라","subtitle":"","price":86000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728474686/1728474686.jpg"},{"category":"성기능","itemId":"1728193232","title":"타달리스-SX Tadalis-SX 타다라필20mg x 40정 아잔타파마","subtitle":"","price":37000,"originalPrice":58710,"discount":37,"imageUrl":"https://talmoschool.com/data/item/1728193232/1728193232.jpg"},{"category":"성기능","itemId":"1728193229","title":"타다칩 Tadacip 타다라필 20mg x 40정 시플라","subtitle":"","price":46000,"originalPrice":63570,"discount":28,"imageUrl":"https://talmoschool.com/data/item/1728193229/1728193229.jpg"},{"category":"성기능","itemId":"1728193224","title":"타다리스타 60mg 100정","subtitle":"","price":62168,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193224/1728193224.jpg"},{"category":"성기능","itemId":"1728193223","title":"타다리스타 5mg 100정","subtitle":"","price":56645,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193223/1728193223.jpg"},{"category":"성기능","itemId":"1728193222","title":"타다리스타 40mg 100정","subtitle":"","price":60787,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193222/1728193222.jpg"},{"category":"성기능","itemId":"1728193221","title":"타다리스타 20mg 100정","subtitle":"","price":59397,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193221/1728193221.jpg"},{"category":"성기능","itemId":"1728193217","title":"타다라이즈 프로페셔널 Tadarise professional 타다라필 40mg x 100정 선라이즈","subtitle":"","price":71000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193217/1728193217.jpg"},{"category":"성기능","itemId":"1728193215","title":"타다라이즈 젤리 20mg 50포","subtitle":"","price":105100,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193215/1728193215.jpg"},{"category":"성기능","itemId":"1728193214","title":"타다라이즈 60mg 100정","subtitle":"","price":63540,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193214/1728193214.jpg"},{"category":"성기능","itemId":"1728193213","title":"타다라이즈 5mg 100정","subtitle":"","price":53163,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193213/1728193213.jpg"},{"category":"성기능","itemId":"1728193212","title":"타다라이즈 40mg 100정","subtitle":"","price":63530,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193212/1728193212.jpg"},{"category":"성기능","itemId":"1728193211","title":"타다라이즈 20mg 100정","subtitle":"","price":60783,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193211/1728193211.jpg"},{"category":"성기능","itemId":"1728193210","title":"타다라이즈 10mg 100정","subtitle":"","price":53856,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193210/1728193210.jpg"},{"category":"성기능","itemId":"1728193205","title":"엑스트라 슈퍼타다라이즈 Extra Super Tadarise 타다라필 40mg + 다폭세틴 60mg x 200정 선라이즈","subtitle":"","price":146000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193205/1728193205.jpg"},{"category":"성기능","itemId":"1728193204","title":"앱칼리스 오랄젤리 Apcalis-sx Oral Jelly 타다라필20mg x 35포(5박스) 아잔타파마","subtitle":"","price":66000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193204/1728193204.jpg"},{"category":"성기능","itemId":"1728193202","title":"슈퍼타다라이즈 Super TADARISE 복합ED x 100정 선라이즈","subtitle":"","price":81000,"originalPrice":98280,"discount":18,"imageUrl":"https://talmoschool.com/data/item/1728193202/1728193202.jpg"},{"category":"성기능","itemId":"1728193201","title":"슈퍼비달리스타 Super Vidalista 타다라필20mg x 100정 센츄리온","subtitle":"","price":71000,"originalPrice":80177,"discount":11,"imageUrl":"https://talmoschool.com/data/item/1728193201/1728193201.jpg"},{"category":"성기능","itemId":"1728193200","title":"비달리스타CT 츄어블 Vidalista CT chewable 타다라필 20mg x 100정 센츄리온","subtitle":"","price":63000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193200/1728193200.jpg"},{"category":"성기능","itemId":"1728193199","title":"비달리스타 프로 Vidalista Pro 타다라필 20mg x 100정 센츄리온","subtitle":"","price":69000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193199/1728193199.jpg"},{"category":"성기능","itemId":"1728193198","title":"비달리스타 블랙80 Vidalista Black80 타다라필 80mg x 100정 센츄리온","subtitle":"","price":81000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193198/1728193198.jpg"},{"category":"성기능","itemId":"1728193197","title":"비달리스타80 Vidalista80 타다라필 80mg x 100정 센츄리온","subtitle":"","price":69000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193197/1728193197.jpg"},{"category":"성기능","itemId":"1728193196","title":"비달리스타60 Vidalista60 타다라필 60mg x 100정 센츄리온","subtitle":"","price":67000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193196/1728193196.jpg"},{"category":"성기능","itemId":"1728193195","title":"비달리스타5 Vidalista5 타다라필5mg x 100정 센츄리온","subtitle":"","price":52000,"originalPrice":58005,"discount":10,"imageUrl":"https://talmoschool.com/data/item/1728193195/1728193195.jpg"},{"category":"성기능","itemId":"1728193194","title":"비달리스타40 Vidalista40 타다라필 40mg x 100정 센츄리온","subtitle":"","price":65000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193194/1728193194.jpg"},{"category":"성기능","itemId":"1728193193","title":"비달리스타20 Vidalista20 타다라필 20mg x 100정 센츄리온","subtitle":"","price":63000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193193/1728193193.jpg"},{"category":"성기능","itemId":"1728193192","title":"비달리스타2.5 Vidalista2.5 타다라필 2.5mg x 300정 센츄리온","subtitle":"","price":86000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193192/1728193192.jpg"},{"category":"성기능","itemId":"1728193191","title":"비달리스타10 Vidalista10 타다라필10mg x 100정 센츄리온","subtitle":"","price":56000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193191/1728193191.jpg"},{"category":"성기능","itemId":"1728193187","title":"하이포스50 ODS Highforce50 ODS 실데나필 50mg x 50매 힐링파마","subtitle":"","price":61000,"originalPrice":80176,"discount":24,"imageUrl":"https://talmoschool.com/data/item/1728193187/1728193187.jpg"},{"category":"성기능","itemId":"1728193186","title":"하이포스100 ODS 100정","subtitle":"","price":94020,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193186/1728193186.jpg"},{"category":"성기능","itemId":"1728193185","title":"하이포스 오럴 젤리 42포","subtitle":"","price":61336,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193185/1728193185.jpg"},{"category":"성기능","itemId":"1728193181","title":"필데나 엑스트라파워 Fildena Extra Power 실데나필150mg x 100정 포춘헬스케어","subtitle":"","price":65000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193181/1728193181.jpg"},{"category":"성기능","itemId":"1728193171","title":"카마그라폴로 Kamagra Polo 실데나필 100mg x 40정 아잔타파마","subtitle":"","price":61000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193171/1728193171.jpg"},{"category":"성기능","itemId":"1728193170","title":"카마그라 오랄젤리 Kamagra OralJelly 실데나필100mg x 35포(5박스) 아잔타파마","subtitle":"","price":61000,"originalPrice":70485,"discount":13,"imageUrl":"https://talmoschool.com/data/item/1728193170/1728193170.jpg"},{"category":"성기능","itemId":"1728193169","title":"카마그라 발포정 Kamagra Effeverscent 실데나필 100mg x 70정 아잔타파마","subtitle":"","price":69000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193169/1728193169.jpg"},{"category":"성기능","itemId":"1728193168","title":"카마그라골드 Kamagra Gold 실데나필 50mg x 40정 아잔타파마","subtitle":"","price":53000,"originalPrice":59675,"discount":11,"imageUrl":"https://talmoschool.com/data/item/1728193168/1728193168.jpg"},{"category":"성기능","itemId":"1728193167","title":"카마그라골드 Kamagra Gold 실데나필100mg x 40정 아잔타파마","subtitle":"","price":62000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193167/1728193167.jpg"},{"category":"성기능","itemId":"1728193166","title":"카마그라CT 츄어블 Kamagra CT 실데나필 100mg x 40정 아잔타파마","subtitle":"","price":61000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193166/1728193166.jpg"},{"category":"성기능","itemId":"1728193164","title":"우노그라50 ODS 100정","subtitle":"","price":80178,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193164/1728193164.jpg"},{"category":"성기능","itemId":"1728193153","title":"슈퍼카마그라 오럴젤리 21포","subtitle":"","price":61334,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193153/1728193153.jpg"},{"category":"성기능","itemId":"1728193152","title":"슈퍼필데나 Super FILDENA 실데나필100mg + 다폭세틴60mg x 40정 포춘헬스케어","subtitle":"","price":65000,"originalPrice":84365,"discount":23,"imageUrl":"https://talmoschool.com/data/item/1728193152/1728193152.jpg"},{"category":"성기능","itemId":"1728193151","title":"슈퍼 카마그라 오럴젤리","subtitle":"","price":72968,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193151/1728193151.jpg"},{"category":"성기능","itemId":"1728193150","title":"슈퍼카마그라 SUPER KAMAGRA 복합ED x 40정 아잔타파마","subtitle":"","price":61000,"originalPrice":77420,"discount":21,"imageUrl":"https://talmoschool.com/data/item/1728193150/1728193150.jpg"},{"category":"성기능","itemId":"1728193147","title":"수하그라 Suhagra 실데나필 100mg x 40정 시플라","subtitle":"","price":47000,"originalPrice":60792,"discount":23,"imageUrl":"https://talmoschool.com/data/item/1728193147/1728193147.jpg"},{"category":"성기능","itemId":"1728193146","title":"수하그라 Suhagra 실데나필 100mg x 80정 시플라","subtitle":"","price":66000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193146/1728193146.jpg"},{"category":"성기능","itemId":"1728193145","title":"센포스FM 여성용 Cenforce FM 실데나필100mg x 100정 센츄리온","subtitle":"","price":40000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193145/1728193145.jpg"},{"category":"성기능","itemId":"1728193144","title":"센포스D CenforceD 복합성분 x 100정 센츄리온","subtitle":"","price":77000,"originalPrice":84356,"discount":9,"imageUrl":"https://talmoschool.com/data/item/1728193144/1728193144.jpg"},{"category":"성기능","itemId":"1728193143","title":"센포스 프로페셔널 Cenforce Professional 실데나필 100mg x 100정 센츄리온","subtitle":"","price":67000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193143/1728193143.jpg"},{"category":"성기능","itemId":"1728193141","title":"센포스 소프트 츄어블 Cenforce Soft chewable 실데나필 100mg x 100정 센츄리온","subtitle":"","price":67000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193141/1728193141.jpg"},{"category":"성기능","itemId":"1728193140","title":"센포스50 Cenforce50 실데나필 50mg x 100정 센츄리온","subtitle":"","price":57000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193140/1728193140.jpg"},{"category":"성기능","itemId":"1728193139","title":"센포스25 Cenforce25 실데나필 25mg x 100정 센츄리온","subtitle":"","price":52000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193139/1728193139.jpg"},{"category":"성기능","itemId":"1728193138","title":"센포스200 Cenforce200 실데나필 200mg x 100정 센츄리온","subtitle":"","price":79000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193138/1728193138.jpg"},{"category":"성기능","itemId":"1728193137","title":"센포스150 Cenforce150 실데나필 150mg x 100정 센츄리온","subtitle":"","price":69000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193137/1728193137.jpg"},{"category":"성기능","itemId":"1728193136","title":"센포스120 Cenforce120 실데나필 120mg x 100정 센츄리온","subtitle":"","price":67000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193136/1728193136.jpg"},{"category":"성기능","itemId":"1728193135","title":"센포스100 Cenforce100 실데나필100mg 200정 센츄리온","subtitle":"","price":92000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193135/1728193135.jpg"},{"category":"성기능","itemId":"1728665457","title":"블루포스 100 Blueforce 100 실데나필 100mg x 300정 제리마","subtitle":"","price":111000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728665457/1728665457.jpg"},{"category":"성기능","itemId":"1728665435","title":"블루포스 100 Blueforce 100 실데나필 100mg x 200정 제리마","subtitle":"","price":91000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728665435/1728665435.jpg"},{"category":"성기능","itemId":"1728665187","title":"블루포스 25 Blueforce 25 실데나필 25mg x 300정 제리마","subtitle":"","price":101000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728665187/1728665187.jpg"},{"category":"성기능","itemId":"1728665157","title":"블루포스 25 Blueforce 25 실데나필 25mg x 200정 제리마","subtitle":"","price":81000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728665157/1728665157.jpg"},{"category":"성기능","itemId":"1728664936","title":"블루포스 50 Blueforce 50 실데나필 50mg x 300정 제리마","subtitle":"","price":106000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728664936/1728664936.jpg"},{"category":"성기능","itemId":"1728664900","title":"블루포스 50 Blueforce 50 실데나필 50mg x 100정 제리마","subtitle":"","price":56000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728664900/1728664900.jpg"},{"category":"성기능","itemId":"1728664364","title":"카마그라폴로 Kamagra Polo 실데나필100mg x 120정 아잔타파마","subtitle":"","price":141000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728664364/1728664364.jpg"},{"category":"성기능","itemId":"1728664326","title":"카마그라폴로 Kamagra Polo 실데나필100mg x 80정 아잔타파마","subtitle":"","price":101000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728664326/1728664326.jpg"},{"category":"성기능","itemId":"1728663299","title":"필데나 더블 Fildena Double 실데나필 200mg x 300정 포춘헬스케어","subtitle":"","price":149000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728663299/1728663299.jpg"},{"category":"성기능","itemId":"1728663239","title":"필데나 더블 Fildena Double 실데나필 200mg x 200정 포춘헬스케어","subtitle":"","price":109000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728663239/1728663239.jpg"},{"category":"성기능","itemId":"1728662849","title":"필데나 엑스트라파워 Fildena Extra Power 실데나필150mg x 300정 포춘헬스케어","subtitle":"","price":125000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728662849/1728662849.jpg"},{"category":"성기능","itemId":"1728662812","title":"필데나 엑스트라파워 Fildena Extra Power 실데나필150mg x 200정 포춘헬스케어","subtitle":"","price":95000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728662812/1728662812.jpg"},{"category":"성기능","itemId":"1728563968","title":"실디그라 슈퍼파워 Sildigra Super Power 실데나필100mg + 다폭세틴60mg x 120정 RSM","subtitle":"","price":123000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728563968/1728563968.jpg"},{"category":"성기능","itemId":"1728563939","title":"실디그라 슈퍼파워 Sildigra Super Power 실데나필100mg + 다폭세틴60mg x 80정 RSM","subtitle":"","price":93000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728563939/1728563939.jpg"},{"category":"성기능","itemId":"1728563724","title":"슈퍼필데나 Super FILDENA 실데나필100mg + 다폭세틴60mg x 120정 포춘헬스케어","subtitle":"","price":125000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728563724/1728563724.jpg"},{"category":"성기능","itemId":"1728563689","title":"슈퍼필데나 Super FILDENA 실데나필100mg + 다폭세틴60mg x 80정 포춘헬스케어","subtitle":"","price":95000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728563689/1728563689.jpg"},{"category":"성기능","itemId":"1728560914","title":"코브라120 Cobra120 실데나필120mg x 200정 햅파마","subtitle":"","price":121000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728560914/1728560914.jpg"},{"category":"성기능","itemId":"1728560821","title":"코브라120 Cobra120 실데나필120mg x 150정 햅파마","subtitle":"","price":96000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728560821/1728560821.jpg"},{"category":"성기능","itemId":"1728560793","title":"코브라120 Cobra120 실데나필120mg x 100정 햅파마","subtitle":"","price":71000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728560793/1728560793.jpg"},{"category":"성기능","itemId":"1728559940","title":"비달리스타 블랙80 Vidalista Black80 타다라필80mg x 300정 센츄리온","subtitle":"","price":161000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728559940/1728559940.jpg"},{"category":"성기능","itemId":"1728559892","title":"비달리스타 블랙80 Vidalista Black80 타다라필80mg x 200정 센츄리온","subtitle":"","price":121000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728559892/1728559892.jpg"},{"category":"성기능","itemId":"1728554913","title":"타다플로 Tadaflo 타다라필5mg x 90정 시플라","subtitle":"","price":122000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728554913/1728554913.jpg"},{"category":"성기능","itemId":"1728554826","title":"타다플로 Tadaflo 타다라필5mg x 60정 시플라","subtitle":"","price":92000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728554826/1728554826.jpg"},{"category":"성기능","itemId":"1728554049","title":"타달리스-SX Tadalis-SX 타다라필20mg x 120정 아잔타파마","subtitle":"","price":99000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728554049/1728554049.jpg"},{"category":"성기능","itemId":"1728554015","title":"타달리스-SX Tadalis-SX 타다라필20mg x 80정 아잔타파마","subtitle":"","price":67000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728554015/1728554015.jpg"},{"category":"성기능","itemId":"1728481685","title":"카마그라CT 츄어블 Kamagra CT 실데나필100mg x 80정 아잔타파마","subtitle":"","price":101000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728481685/1728481685.jpg"},{"category":"성기능","itemId":"1728481307","title":"카마그라CT 츄어블 Kamagra CT 실데나필100mg x 120정 아잔타파마","subtitle":"","price":141000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728481307/1728481307.jpg"},{"category":"성기능","itemId":"1728481070","title":"피메일그라 Femalegra 여성용 비아그라 실데나필 100mg x 80정 선라이즈","subtitle":"","price":36000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728481070/1728481070.jpg"},{"category":"성기능","itemId":"1728480698","title":"엑스트라 슈퍼타다라이즈 Extra Super Tadarise 타다라필 40mg + 다폭세틴 60mg x 300정 선라이즈","subtitle":"","price":196000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728480698/1728480698.jpg"},{"category":"성기능","itemId":"1728480665","title":"엑스트라 슈퍼타다라이즈 Extra Super Tadarise 타다라필 40mg + 다폭세틴 60mg x 100정 선라이즈","subtitle":"","price":96000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728480665/1728480665.jpg"},{"category":"성기능","itemId":"1728193231","title":"타다플로 Tadaflo 타다라필 5mg x 30정 시플라","subtitle":"","price":63000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193231/1728193231.jpg"},{"category":"성기능","itemId":"1728193230","title":"타다펨 20mg 40정","subtitle":"","price":63520,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193230/1728193230.jpg"},{"category":"성기능","itemId":"1728193228","title":"타다소프트 40mg 100정","subtitle":"","price":70585,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193228/1728193228.jpg"},{"category":"성기능","itemId":"1728193227","title":"타다소프트 20mg 100정","subtitle":"","price":63560,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193227/1728193227.jpg"},{"category":"성기능","itemId":"1728193226","title":"타다리프트 20mg 20정","subtitle":"","price":118960,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193226/1728193226.jpg"},{"category":"성기능","itemId":"1728193225","title":"타다리스타 슈퍼 액티브 20mg x 100정","subtitle":"","price":63590,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193225/1728193225.jpg"},{"category":"성기능","itemId":"1728193220","title":"타다리 60mg 100정","subtitle":"","price":63580,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193220/1728193220.jpg"},{"category":"성기능","itemId":"1728193219","title":"타다리 40mg 100정","subtitle":"","price":62167,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193219/1728193219.jpg"},{"category":"성기능","itemId":"1728193218","title":"타다리 20mg 100정","subtitle":"","price":60786,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193218/1728193218.jpg"},{"category":"성기능","itemId":"1728193216","title":"타다라이즈 프로 20mg 100정","subtitle":"","price":63550,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193216/1728193216.jpg"},{"category":"성기능","itemId":"1728193209","title":"타다그라 프로 100정","subtitle":"","price":60781,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193209/1728193209.jpg"},{"category":"성기능","itemId":"1728193208","title":"타다그라 스트롱 40mg 100정","subtitle":"","price":66420,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193208/1728193208.jpg"},{"category":"성기능","itemId":"1728193207","title":"타다그라 슈퍼 60mg 100정","subtitle":"","price":63450,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193207/1728193207.jpg"},{"category":"성기능","itemId":"1728193206","title":"타다그라 20mg 100정","subtitle":"","price":60782,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193206/1728193206.jpg"},{"category":"성기능","itemId":"1728193190","title":"메갈리스 20mg 40정","subtitle":"","price":124490,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193190/1728193190.jpg"},{"category":"성기능","itemId":"1728193189","title":"메갈리스 10mg 40정","subtitle":"","price":87096,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193189/1728193189.jpg"},{"category":"성기능","itemId":"1728193188","title":"Forzest 20mg 28정","subtitle":"","price":89588,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193188/1728193188.jpg"},{"category":"성기능","itemId":"1728193184","title":"필라그라 젤리 100mg 28포","subtitle":"","price":59677,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193184/1728193184.jpg"},{"category":"성기능","itemId":"1728193183","title":"필데나CT 100mg 100정","subtitle":"","price":56700,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728193183/1728193183.jpg"},{"category":"피부미용","itemId":"1728202125","title":"아다팔렌 Adaferin Gel 아다팔렌 0.1% 15g x 6개 갈더마","subtitle":"","price":61000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202125/1728202125.jpg"},{"category":"피부미용","itemId":"1728656839","title":"플라센트렉스 PLACENTREX Cream 인태반크림 20g x 6개 알버트다비드","subtitle":"","price":56000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728656839/1728656839.jpg"},{"category":"피부미용","itemId":"1728202193","title":"플라센트렉스 겔 PLACENTREX Gel 인태반성분 20g x 6개 알버트다비드","subtitle":"","price":56000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202193/1728202193.jpg"},{"category":"피부미용","itemId":"1728202192","title":"플라센트렉스 PLACENTREX Cream 인태반크림 20g x 3개/6개/10개 알버트다비드","subtitle":"","price":32000,"originalPrice":67150,"discount":52,"imageUrl":"https://talmoschool.com/data/item/1728202192/1728202192.jpg"},{"category":"피부미용","itemId":"1728202191","title":"플라센트렉스 겔 PLACENTREX Gel 인태반성분 20g x 3개 알버트다비드","subtitle":"","price":31000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202191/1728202191.jpg"},{"category":"피부미용","itemId":"1728202190","title":"이브레아 수란트라 크림 Ivrea Cream 이버멕틴 1% 30g x 6개 아잔타파마","subtitle":"","price":51000,"originalPrice":74651,"discount":32,"imageUrl":"https://talmoschool.com/data/item/1728202190/1728202190.jpg"},{"category":"피부미용","itemId":"1728202189","title":"이브레아 수란트라 크림 Ivrea Cream 이버멕틴 1% 30g x 3개 아잔타파마","subtitle":"","price":34000,"originalPrice":48325,"discount":30,"imageUrl":"https://talmoschool.com/data/item/1728202189/1728202189.jpg"},{"category":"피부미용","itemId":"1728202188","title":"에피듀오겔 30g 2개","subtitle":"","price":82940,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202188/1728202188.jpg"},{"category":"피부미용","itemId":"1728202181","title":"멜라라이트 포르테 크림 Melalite Forte Cream 하이드로퀴논 4% 30g x 6개 애보트","subtitle":"","price":56000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202181/1728202181.jpg"},{"category":"피부미용","itemId":"1728202180","title":"멜라라이트 포르테 크림 Melalite Forte Cream 하이드로퀴논 4% 30g x 3개 애보트","subtitle":"","price":31000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202180/1728202180.jpg"},{"category":"피부미용","itemId":"1728202177","title":"에피듀오겔 30g 2개","subtitle":"","price":82940,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202177/1728202177.jpg"},{"category":"피부미용","itemId":"1728202176","title":"벤작AC 5% 20g 6개","subtitle":"","price":74660,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202176/1728202176.jpg"},{"category":"피부미용","itemId":"1728202175","title":"벤작AC 5% 20g 3개","subtitle":"","price":65489,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202175/1728202175.jpg"},{"category":"피부미용","itemId":"1728202174","title":"벤작AC 2.5% 20g 6개","subtitle":"","price":81278,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202174/1728202174.jpg"},{"category":"피부미용","itemId":"1728202173","title":"벤작AC 2.5% 20g 3개","subtitle":"","price":56764,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202173/1728202173.jpg"},{"category":"피부미용","itemId":"1728202147","title":"트레티힐 크림 Tretiheal Cream 트레티노인 0.05% 20g x 6개 힐링파마","subtitle":"","price":62000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202147/1728202147.jpg"},{"category":"피부미용","itemId":"1728202146","title":"트레티힐 크림 Tretiheal Cream 트레티노인 0.025% 20gx 3개 힐링파마","subtitle":"","price":31000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202146/1728202146.jpg"},{"category":"피부미용","itemId":"1728202145","title":"트레티힐 크림 Tretiheal Cream 트레티노인 0.05% 20g x 3개 힐링파마","subtitle":"","price":36000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202145/1728202145.jpg"},{"category":"피부미용","itemId":"1728202144","title":"트레티힐 크림 Tretiheal Cream 트레티노인 0.025% 0.05% 20g x 6개 힐링파마","subtitle":"","price":56000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202144/1728202144.jpg"},{"category":"피부미용","itemId":"1728202143","title":"에이렛젤 A-RET Gel 트레티노인 0.1% 20g x 6개 메나리니","subtitle":"","price":54000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202143/1728202143.jpg"},{"category":"피부미용","itemId":"1728202142","title":"에이렛젤 A-RET Gel 트레티노인 0.1% 20g x 3개 메나리니","subtitle":"","price":32000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202142/1728202142.jpg"},{"category":"피부미용","itemId":"1728202141","title":"에이렛젤 A-RET Gel 트레티노인 0.05% 20g x 6개 메나리니","subtitle":"","price":48000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202141/1728202141.jpg"},{"category":"피부미용","itemId":"1728202140","title":"에이렛젤 A-RET Gel 트레티노인 0.05% 20g x 3개 메나리니","subtitle":"","price":28000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202140/1728202140.jpg"},{"category":"피부미용","itemId":"1728202139","title":"에이렛젤 A-RET Gel 트레티노인 0.025% 20g x 6개 메나리니","subtitle":"","price":42000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202139/1728202139.jpg"},{"category":"피부미용","itemId":"1728202131","title":"레티노A 마이트렛 0.1% 20g 6개","subtitle":"","price":71306,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202131/1728202131.jpg"},{"category":"피부미용","itemId":"1728202130","title":"레티노A 마이트렛 0.1% 20g 3개","subtitle":"","price":46653,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202130/1728202130.jpg"},{"category":"피부미용","itemId":"1728202129","title":"레티노A 마이트렛 0.04% 20g 6개","subtitle":"","price":67982,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202129/1728202129.jpg"},{"category":"피부미용","itemId":"1728202128","title":"레티노A 마이트렛 0.04% 20g 3개","subtitle":"","price":44991,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202128/1728202128.jpg"},{"category":"피부미용","itemId":"1728202127","title":"레티노A 마이트렛 0.025% 20g 6개","subtitle":"","price":62175,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202127/1728202127.jpg"},{"category":"피부미용","itemId":"1728202126","title":"레티노A 마이트렛 0.025% 20g 3개","subtitle":"","price":42087,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202126/1728202126.jpg"},{"category":"피부미용","itemId":"1728658835","title":"아지덤 크림 Aziderm Cream 아젤라익 산20% 15g x 6개 마이크로랩스","subtitle":"","price":66000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728658835/1728658835.jpg"},{"category":"피부미용","itemId":"1728658663","title":"아지덤 크림 Aziderm Cream 아젤라익 산10% 15g x 6개 마이크로랩스","subtitle":"","price":58000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728658663/1728658663.jpg"},{"category":"피부미용","itemId":"1728658438","title":"아지덤젤 Aziderm Gel 아젤라익 산20% 15g x 3개 마이크로랩스","subtitle":"","price":35000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728658438/1728658438.jpg"},{"category":"피부미용","itemId":"1728658116","title":"아지덤젤 Aziderm Gel 아젤라익 산10% 15g x 6개 마이크로랩스","subtitle":"","price":56000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728658116/1728658116.jpg"},{"category":"피부미용","itemId":"1728568365","title":"아큐파인 ACCUFINE 이소트레티노인40mg x 300정 힐링파마","subtitle":"","price":126000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728568365/1728568365.jpg"},{"category":"피부미용","itemId":"1728568301","title":"아큐파인 ACCUFINE 이소트레티노인40mg x 200정 힐링파마","subtitle":"","price":86000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728568301/1728568301.jpg"},{"category":"피부미용","itemId":"1728567885","title":"아큐파인 ACCUFINE 이소트레티노인30mg x 300정 힐링파마","subtitle":"","price":106000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728567885/1728567885.jpg"},{"category":"피부미용","itemId":"1728567842","title":"아큐파인 ACCUFINE 이소트레티노인30mg x 200정 힐링파마","subtitle":"","price":76000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728567842/1728567842.jpg"},{"category":"피부미용","itemId":"1728567550","title":"아큐파인 ACCUFINE 이소트레티노인 20mg x 300정 힐링파마","subtitle":"","price":81000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728567550/1728567550.jpg"},{"category":"피부미용","itemId":"1728567522","title":"아큐파인 ACCUFINE 이소트레티노인 20mg x 200정 힐링파마","subtitle":"","price":62000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728567522/1728567522.jpg"},{"category":"피부미용","itemId":"1728567312","title":"아큐파인 ACCUFINE 이소트레티노인 10mg x 300정 힐링파마","subtitle":"","price":76000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728567312/1728567312.jpg"},{"category":"피부미용","itemId":"1728567288","title":"아큐파인 ACCUFINE 이소트레티노인 10mg x 200정 힐링파마","subtitle":"","price":57000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728567288/1728567288.jpg"},{"category":"피부미용","itemId":"1728567050","title":"아큐파인 ACCUFINE 이소트레티노인 5mg x 300정 힐링파마","subtitle":"","price":74000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728567050/1728567050.jpg"},{"category":"피부미용","itemId":"1728567017","title":"아큐파인 ACCUFINE 이소트레티노인 5mg x 200정 힐링파마","subtitle":"","price":55000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728567017/1728567017.jpg"},{"category":"피부미용","itemId":"1728202221","title":"트레티젠 20mg 400정","subtitle":"","price":326700,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202221/1728202221.jpg"},{"category":"피부미용","itemId":"1728202220","title":"트레티젠 20mg 200정","subtitle":"","price":188200,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202220/1728202220.jpg"},{"category":"피부미용","itemId":"1728202219","title":"트레티젠 10mg 400정","subtitle":"","price":105100,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202219/1728202219.jpg"},{"category":"피부미용","itemId":"1728202218","title":"트레티젠 10mg 200정","subtitle":"","price":52470,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202218/1728202218.jpg"},{"category":"피부미용","itemId":"1728202217","title":"트레티바 5mg 400정","subtitle":"","price":152190,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202217/1728202217.jpg"},{"category":"피부미용","itemId":"1728202216","title":"트레티바 5mg 200정","subtitle":"","price":100955,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202216/1728202216.jpg"},{"category":"피부미용","itemId":"1728202215","title":"트레티바 40mg 400정","subtitle":"","price":238060,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202215/1728202215.jpg"},{"category":"피부미용","itemId":"1728202214","title":"트레티바 40mg 200정","subtitle":"","price":130030,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202214/1728202214.jpg"},{"category":"피부미용","itemId":"1728202213","title":"트레티바 20mg 400정","subtitle":"","price":160550,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202213/1728202213.jpg"},{"category":"피부미용","itemId":"1728202212","title":"트레티바 20mg 200정","subtitle":"","price":105130,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202212/1728202212.jpg"},{"category":"피부미용","itemId":"1728202211","title":"트레티바 10mg 400정","subtitle":"","price":152195,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202211/1728202211.jpg"},{"category":"피부미용","itemId":"1728202210","title":"트레티바 10mg 200정","subtitle":"","price":100945,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202210/1728202210.jpg"},{"category":"피부미용","itemId":"1728202209","title":"이소트로인 5mg 300정","subtitle":"","price":120335,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202209/1728202209.jpg"},{"category":"피부미용","itemId":"1728202208","title":"이소트로인 5mg 120정","subtitle":"","price":77954,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202208/1728202208.jpg"},{"category":"피부미용","itemId":"1728202207","title":"이소트로인 30mg 90정","subtitle":"","price":99560,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202207/1728202207.jpg"},{"category":"피부미용","itemId":"1728202206","title":"이소트로인 30mg 300정","subtitle":"","price":257450,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202206/1728202206.jpg"},{"category":"피부미용","itemId":"1728202205","title":"이소트로인 20mg 90정","subtitle":"","price":96792,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202205/1728202205.jpg"},{"category":"피부미용","itemId":"1728202204","title":"이소트로인 20mg 300정","subtitle":"","price":163275,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202204/1728202204.jpg"},{"category":"피부미용","itemId":"1728202203","title":"이소트로인 10mg 300정","subtitle":"","price":157730,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202203/1728202203.jpg"},{"category":"피부미용","itemId":"1728202202","title":"이소트로인 10mg 120정","subtitle":"","price":92912,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202202/1728202202.jpg"},{"category":"피부미용","itemId":"1728202200","title":"아큐파인 ACCUFINE 이소트레티노인 5mg 100정 힐링파마","subtitle":"","price":35000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202200/1728202200.jpg"},{"category":"피부미용","itemId":"1728202199","title":"아큐파인 ACCUFINE 이소트레티노인40mg x 100정 힐링파마","subtitle":"","price":57000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202199/1728202199.jpg"},{"category":"피부미용","itemId":"1728202198","title":"아큐파인 ACCUFINE 이소트레티노인30mg x 100정 힐링파마","subtitle":"","price":47000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202198/1728202198.jpg"},{"category":"피부미용","itemId":"1728202197","title":"아큐파인 ACCUFINE 이소트레티노인 20mg x 100정 힐링파마","subtitle":"","price":42000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202197/1728202197.jpg"},{"category":"피부미용","itemId":"1728202196","title":"아큐파인 ACCUFINE 이소트레티노인 10mg x 100정 힐링파마","subtitle":"","price":37000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202196/1728202196.jpg"},{"category":"피부미용","itemId":"1728202187","title":"아지덤젤 Aziderm Gel 아젤라익 산10% 15g x 3개 마이크로랩스","subtitle":"","price":30000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202187/1728202187.jpg"},{"category":"피부미용","itemId":"1728202186","title":"아지덤 크림 Aziderm Cream 아젤라익 산20% 15g x 3개 마이크로랩스","subtitle":"","price":37000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202186/1728202186.jpg"},{"category":"피부미용","itemId":"1728202185","title":"아지덤젤 Aziderm Gel 아젤라익 산20% 15g x 6개 마이크로랩스","subtitle":"","price":64000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202185/1728202185.jpg"},{"category":"피부미용","itemId":"1728202184","title":"아지덤 크림 Aziderm Cream 아젤라익 산10% 15g x 3개 마이크로랩스","subtitle":"","price":32000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202184/1728202184.jpg"},{"category":"피부미용","itemId":"1728202182","title":"아다팔렌 Adaferin Gel 아다팔렌15g x 3개 갈더마","subtitle":"","price":36000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202182/1728202182.jpg"},{"category":"피부미용","itemId":"1728202179","title":"Acivir 5% 10g 4개- 아시클로버","subtitle":"","price":62442,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202179/1728202179.jpg"},{"category":"피부미용","itemId":"1728202178","title":"Acivir 5% 10g 2개- 아시클로버","subtitle":"","price":42221,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202178/1728202178.jpg"},{"category":"피부미용","itemId":"1728202172","title":"나디백트 크림 1% 10g 4개","subtitle":"","price":54135,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202172/1728202172.jpg"},{"category":"피부미용","itemId":"1728202171","title":"나디백트 크림 1% 10g 2개","subtitle":"","price":38067,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202171/1728202171.jpg"},{"category":"피부미용","itemId":"1728202170","title":"나독신 오인트먼트 5g 4개","subtitle":"","price":54133,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202170/1728202170.jpg"},{"category":"피부미용","itemId":"1728202169","title":"나독신 오인트먼트 5g 2개","subtitle":"","price":38066,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202169/1728202169.jpg"},{"category":"피부미용","itemId":"1728202168","title":"나독신 10g 4개","subtitle":"","price":54134,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202168/1728202168.jpg"},{"category":"피부미용","itemId":"1728202167","title":"나독신 10g 2개","subtitle":"","price":38067,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202167/1728202167.jpg"},{"category":"피부미용","itemId":"1728202153","title":"다판타 DAPANTA 다파글리플로진 5mg x 100정 아잔타파마","subtitle":"","price":61000,"originalPrice":95405,"discount":36,"imageUrl":"https://talmoschool.com/data/item/1728202153/1728202153.jpg"},{"category":"피부미용","itemId":"1728202149","title":"다파스마트M DapaSmart M 다파글리플로진10+메트포민500 10/500 x 100정 힐링파마","subtitle":"","price":65000,"originalPrice":99560,"discount":35,"imageUrl":"https://talmoschool.com/data/item/1728202149/1728202149.jpg"},{"category":"피부미용","itemId":"1728202148","title":"다파스마트M DapaSmart M 다파글리플로진10+메트포민1000 10/1000 x 100정 힐링파마","subtitle":"","price":71000,"originalPrice":99560,"discount":29,"imageUrl":"https://talmoschool.com/data/item/1728202148/1728202148.jpg"},{"category":"피부미용","itemId":"1728202138","title":"에이렛젤 A-RET Gel 트레티노인 0.025% 20g x 3개 메나리니","subtitle":"","price":25000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202138/1728202138.jpg"},{"category":"피부미용","itemId":"1728202137","title":"에이렛HC크림 15g 6개","subtitle":"","price":74640,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202137/1728202137.jpg"},{"category":"피부미용","itemId":"1728202136","title":"에이렛HC크림 15g 3개","subtitle":"","price":48320,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202136/1728202136.jpg"},{"category":"다이어트","itemId":"1728566630","title":"슬림탑 Slimtop 올리스타트120mg x 120정(4박스) 힐링파마","subtitle":"","price":93000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728566630/1728566630.jpg"},{"category":"다이어트","itemId":"1728566600","title":"슬림탑 Slimtop 올리스타트120mg x 90정(3박스) 힐링파마","subtitle":"","price":73000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728566600/1728566600.jpg"},{"category":"다이어트","itemId":"1728566571","title":"슬림탑 Slimtop 올리스타트120mg x 60정(2박스) 힐링파마","subtitle":"","price":54000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728566571/1728566571.jpg"},{"category":"다이어트","itemId":"1728566333","title":"슬림탑 Slimtop 올리스타트 60mg x 120정(4박스) 힐링파마","subtitle":"","price":89000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728566333/1728566333.jpg"},{"category":"다이어트","itemId":"1728566286","title":"슬림탑 Slimtop 올리스타트 60mg x 90정(3박스) 힐링파마","subtitle":"","price":69000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728566286/1728566286.jpg"},{"category":"다이어트","itemId":"1728566216","title":"슬림탑 Slimtop 올리스타트 60mg x 60정(2박스) 힐링파마","subtitle":"","price":46000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728566216/1728566216.jpg"},{"category":"다이어트","itemId":"1728565888","title":"올리갈 Orligal 올리스타트120mg x 252정(3박스) 햅파마 시그니쳐","subtitle":"","price":141000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728565888/1728565888.jpg"},{"category":"다이어트","itemId":"1728565848","title":"올리갈 Orligal 올리스타트120mg x 168정(2박스) 햅파마 시그니쳐","subtitle":"","price":101000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728565848/1728565848.jpg"},{"category":"다이어트","itemId":"1728565543","title":"리벨서스 Rybelsus 세마글루타이드 14mg x 60정(6박스) 노보노디스크","subtitle":"","price":600000,"originalPrice":760000,"discount":21,"imageUrl":"https://talmoschool.com/data/item/1728565543/1728565543.jpg"},{"category":"다이어트","itemId":"1728565342","title":"리벨서스 Rybelsus 세마글루타이드 7mg x 60정(6박스) 노보노디스크","subtitle":"","price":490000,"originalPrice":700000,"discount":30,"imageUrl":"https://talmoschool.com/data/item/1728565342/1728565342.jpg"},{"category":"다이어트","itemId":"1728202164","title":"포시가 10mg 84정","subtitle":"","price":112025,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202164/1728202164.jpg"},{"category":"다이어트","itemId":"1728202163","title":"포시가 10mg 168정","subtitle":"","price":153575,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202163/1728202163.jpg"},{"category":"다이어트","itemId":"1728202162","title":"올리갈 Orligal 올리스타트120mg x 84정(1박스) 햅파마 시그니쳐","subtitle":"","price":61000,"originalPrice":119505,"discount":49,"imageUrl":"https://talmoschool.com/data/item/1728202162/1728202162.jpg"},{"category":"다이어트","itemId":"1728202161","title":"슬림탑 Slimtop 올리스타트 60mg x 30정(1박스) 힐링파마","subtitle":"","price":22000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202161/1728202161.jpg"},{"category":"다이어트","itemId":"1728202160","title":"슬림탑 Slimtop 올리스타트120mg x 30정(1박스) 힐링파마","subtitle":"","price":26000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202160/1728202160.jpg"},{"category":"다이어트","itemId":"1728202159","title":"리벨서스 Rybelsus 세마글루타이드 7mg x 30정(3박스) 노보노디스크","subtitle":"","price":259000,"originalPrice":350000,"discount":26,"imageUrl":"https://talmoschool.com/data/item/1728202159/1728202159.jpg"},{"category":"다이어트","itemId":"1728202157","title":"리벨서스 Rybelsus 세마글루타이드 3mg x 30정(3박스) 노보노디스크","subtitle":"","price":225000,"originalPrice":330000,"discount":32,"imageUrl":"https://talmoschool.com/data/item/1728202157/1728202157.jpg"},{"category":"다이어트","itemId":"1728202123","title":"리벨서스 Rybelsus 세마글루타이드 3mg x 60정(6박스) 노보노디스크","subtitle":"","price":430000,"originalPrice":660000,"discount":35,"imageUrl":"https://talmoschool.com/data/item/1728202123/1728202123.jpg"},{"category":"다이어트","itemId":"1728654588","title":"다판타 DAPANTA 다파글리플로진10mg x 300정 아잔타파마","subtitle":"","price":151000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728654588/1728654588.jpg"},{"category":"다이어트","itemId":"1728654546","title":"다판타 DAPANTA 다파글리플로진10mg x 200정 아잔타파마","subtitle":"","price":111000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728654546/1728654546.jpg"},{"category":"다이어트","itemId":"1728654063","title":"다판타 DAPANTA 다파글리플로진5mg x 300정 아잔타파마","subtitle":"","price":131000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728654063/1728654063.jpg"},{"category":"다이어트","itemId":"1728653853","title":"다판타 DAPANTA 다파글리플로진5mg x 200정 아잔타파마","subtitle":"","price":101000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728653853/1728653853.jpg"},{"category":"다이어트","itemId":"1728653356","title":"다파스마트M DapaSmart M 다파글리플로진10+메트포민1000 10/1000 x 300정 힐링파마","subtitle":"","price":150000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728653356/1728653356.jpg"},{"category":"다이어트","itemId":"1728653205","title":"다파스마트M DapaSmart M 다파글리플로진10+메트포민1000 10/1000 x 200정 힐링파마","subtitle":"","price":119000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728653205/1728653205.jpg"},{"category":"다이어트","itemId":"1728652698","title":"다파스마트M DapaSmart M 다파글리플로진10+메트포민500 10/500 x 300정 힐링파마","subtitle":"","price":145000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728652698/1728652698.jpg"},{"category":"다이어트","itemId":"1728652600","title":"다파스마트M DapaSmart M 다파글리플로진10+메트포민500 10/500 x 200정 힐링파마","subtitle":"","price":105000,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728652600/1728652600.jpg"},{"category":"다이어트","itemId":"1728202166","title":"포시가 5mg 84정","subtitle":"","price":107870,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202166/1728202166.jpg"},{"category":"다이어트","itemId":"1728202165","title":"포시가 5mg 168정","subtitle":"","price":149420,"originalPrice":null,"discount":null,"imageUrl":"https://talmoschool.com/data/item/1728202165/1728202165.jpg"},{"category":"다이어트","itemId":"1728202155","title":"리벨서스 Rybelsus 세마글루타이드 14mg x 30정(3박스) 노보노디스크","subtitle":"","price":315000,"originalPrice":380000,"discount":17,"imageUrl":"https://talmoschool.com/data/item/1728202155/1728202155.jpg"},{"category":"다이어트","itemId":"1728202150","title":"다판타 DAPANTA 다파글리플로진10mg x 100정 아잔타파마","subtitle":"","price":66000,"originalPrice":91250,"discount":28,"imageUrl":"https://talmoschool.com/data/item/1728202150/1728202150.jpg"}];

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\u3131-\u318E\uAC00-\uD7A3\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  async function ensureProductFlags(db: any) {
    try {
      const bestCheck = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isBest, 1));
      const bestCount = Number(bestCheck[0]?.count ?? 0);
      if (bestCount > 0) return;

      console.log("[AutoSeed] Setting product flags (isBest, isNew, isFeatured)...");
      const allProducts = await db.select({ id: products.id }).from(products).orderBy(products.id);
      const total = allProducts.length;
      if (total === 0) return;

      for (let idx = 0; idx < total; idx++) {
        const pid = allProducts[idx].id;
        const isBest = idx < 24 ? 1 : 0;
        const isNew = idx >= total - 30 ? 1 : 0;
        const isFeatured = (idx % 15 === 0) ? 1 : 0;
        if (isBest || isNew || isFeatured) {
          await db.update(products).set({ isBest, isNew, isFeatured }).where(eq(products.id, pid));
        }
      }
      console.log("[AutoSeed] Product flags set: ~24 best, ~30 new, ~25 featured.");
    } catch (err) {
      console.error("[AutoSeed] Failed to set product flags:", err);
    }
  }

  async function ensureAdminUser(db: any) {
    try {
      const existing = await db.select().from(users).where(eq(users.email, "admin@talmoschool.com")).limit(1);
      if (existing.length > 0) {
        if (!existing[0].password) {
          const hash = await bcrypt.hash("admin1234", 10);
          await db.update(users).set({ password: hash }).where(eq(users.id, existing[0].id));
          console.log("[AutoSeed] Admin user password initialized.");
        }
        return;
      }
      const hash = await bcrypt.hash("admin1234", 10);
      await db.insert(users).values({
        openId: "system-admin",
        name: "탈모학교",
        email: "admin@talmoschool.com",
        loginMethod: "email",
        role: "admin",
        password: hash,
        lastSignedIn: new Date(),
      }).onDuplicateKeyUpdate({ set: { id: sql`id` } });
      console.log("[AutoSeed] Admin user created with password.");
    } catch (err) {
      console.error("[AutoSeed] Failed to ensure admin user:", err);
    }
  }

  async function ensureTestUsers(db: any) {
    try {
      const testAccounts = [
        { email: "test1@talmoschool.com", name: "테스트유저1", phone: "010-1111-1111", openId: "local_test1@talmoschool.com" },
        { email: "test2@talmoschool.com", name: "테스트유저2", phone: "010-2222-2222", openId: "local_test2@talmoschool.com" },
        { email: "test3@talmoschool.com", name: "테스트유저3", phone: "010-3333-3333", openId: "local_test3@talmoschool.com" },
        { email: "test4@talmoschool.com", name: "테스트유저4", phone: "010-4444-4444", openId: "local_test4@talmoschool.com" },
        { email: "test5@talmoschool.com", name: "테스트유저5", phone: "010-5555-5555", openId: "local_test5@talmoschool.com" },
      ];
      const hash = await bcrypt.hash("1234gg!", 10);
      let created = 0;
      for (const acc of testAccounts) {
        const existing = await db.select().from(users).where(eq(users.email, acc.email)).limit(1);
        if (existing.length === 0) {
          await db.insert(users).values({
            openId: acc.openId,
            name: acc.name,
            email: acc.email,
            phone: acc.phone,
            loginMethod: "email",
            role: "user",
            password: hash,
            lastSignedIn: new Date(),
          }).onDuplicateKeyUpdate({ set: { id: sql`id` } });
          created++;
        }
      }
      if (created > 0) console.log(`[AutoSeed] ${created} test users created.`);
    } catch (err) {
      console.error("[AutoSeed] Failed to ensure test users:", err);
    }
  }

  const realReviews = [
    { title: "비달리스타60 Vidalista60 타다라필 60mg x 200정 센츄리온", product: "비달리스타60 Vidalista60 타다라필 60mg x 200정 센츄리온", author: "태민", date: "2026-02-25" },
    { title: "물건 잘 받았습니다", product: "수하그라 Suhagra 실데나필 100mg x 80정 시플라", author: "성수피아", date: "2026-02-04" },
    { title: "상품 잘 받았습니다", product: "카마그라골드 Kamagra Gold 실데나필 50mg x 40정 아잔타파마", author: "성수피아", date: "2025-12-26" },
    { title: "잘, 도착했습니다.", product: "F페시아 F-pesia 피나스테리드 1mg x 600정 시플라", author: "길바닥삶", date: "2025-12-17" },
    { title: "잘, 도착했습니다.", product: "미녹시분2.5 600정", author: "길바닥삶", date: "2025-12-17" },
    { title: "수량 맞게 잘 도착했습니다!", product: "이브레아 수란트라 크림 Ivrea Cream 이버멕틴 1% 30g x 6개 아잔타파마", author: "회원", date: "2025-09-14" },
    { title: "먹고 있습니다 배송 좋아요", product: "아큐파인 ACCUFINE 이소트레티노인30mg x 100정 힐링파마", author: "회원", date: "2025-09-13" },
    { title: "유통기한 길다아아아", product: "벤작AC 5% 20g 6개", author: "회원", date: "2025-09-13" },
    { title: "배송 생각보다 빨랐습니다", product: "힐페시아 Healpecia 피나스테리드 1mg x 100정 힐링파마", author: "회원", date: "2025-09-11" },
    { title: "여러 다이어트약 먹어봤는데 요게 효과 있었음", product: "슬림탑 Slimtop 올리스타트120mg x 30정(1박스) 힐링파마", author: "회원", date: "2025-09-11" },
    { title: "당뇨약 좋습니다", product: "포시가 5mg 168정", author: "회원", date: "2025-09-10" },
    { title: "에피듀오겔 굿", product: "에피듀오겔 30g 2개", author: "회원", date: "2025-09-09" },
    { title: "복용하고 머리가 좀 덜 빠지는거 같네요", product: "미녹시분10 600정", author: "회원", date: "2025-09-07" },
    { title: "다이어트약 효과 좋네요", product: "리벨서스 Rybelsus 세마글루타이드 3mg x 30정(3박스) 노보노디스크", author: "회원", date: "2025-09-06" },
    { title: "잘 도착했습니다.", product: "수하그라 Suhagra 실데나필 100mg x 40정 시플라", author: "회원", date: "2025-09-03" },
    { title: "리벨서스 효과봤어요", product: "리벨서스 Rybelsus 세마글루타이드 7mg x 30정(3박스) 노보노디스크", author: "회원", date: "2025-09-01" },
    { title: "잘 도착했습니다", product: "힐페시아 Healpecia 피나스테리드 1mg x 300정 힐링파마", author: "회원", date: "2025-08-29" },
    { title: "2주만에 도착! 좋아요", product: "두타놀0.5 Dutanol0.5 두타스테리드 0.5mg x 300정 크놀헬스케어", author: "회원", date: "2025-08-25" },
    { title: "탈모약 잘 받았습니다", product: "F페시아 F-pesia 피나스테리드 1mg x 300정 시플라", author: "회원", date: "2025-08-20" },
    { title: "배송 빠르고 좋습니다", product: "모르10 MORR10 미녹시딜 10% 60ML x 3박스 인타스", author: "회원", date: "2025-08-18" },
    { title: "재구매합니다 효과좋아요", product: "피낙스 FINAX 피나스테리드 1mg x 600정 닥터레디스", author: "회원", date: "2025-08-15" },
    { title: "아주 만족합니다", product: "센포스100 Cenforce100 실데나필 100mg x 100정 센츄리온", author: "회원", date: "2025-08-12" },
    { title: "잘 도착했습니다 감사합니다", product: "타다라이즈20 Tadarise20 타다라필 20mg x 100정 선라이즈", author: "회원", date: "2025-08-10" },
    { title: "좋습니다 재주문할게요", product: "비달리스타20 Vidalista20 타다라필 20mg x 100정 센츄리온", author: "회원", date: "2025-08-08" },
    { title: "피부가 좋아졌어요", product: "에피듀오겔 30g 2개", author: "회원", date: "2025-08-05" },
    { title: "효과 있네요 감사합니다", product: "카마그라 오럴젤리 Kamagra Oral Jelly 실데나필 100mg x 7포 아잔타파마", author: "회원", date: "2025-08-03" },
    { title: "배송 잘 됐습니다", product: "투게인5 Tugain5 분무형 미녹시딜 5% 60ML x 6박스 시플라", author: "회원", date: "2025-07-30" },
    { title: "좋아요 재주문", product: "미녹시탑5 MinoxyTop5 미녹시딜 5% 60ML x 6박스 Zeelab", author: "회원", date: "2025-07-28" },
    { title: "오래 쓰고있는데 효과 좋습니다", product: "두프로스트 Duprost 두타스테리드 0.5mg x 300정 시플라", author: "회원", date: "2025-07-25" },
    { title: "탈모약 저렴하게 잘 구매했습니다", product: "힐페시아 Healpecia 피나스테리드 1mg x 200정 힐링파마", author: "회원", date: "2025-07-22" },
    { title: "포장 깔끔하고 좋아요", product: "HAIR 4U F 5% 180ml", author: "회원", date: "2025-07-20" },
    { title: "재구매입니다", product: "슬림탑 Slimtop 올리스타트120mg x 90정(3박스) 힐링파마", author: "회원", date: "2025-07-18" },
    { title: "진짜 좋아요 추천합니다", product: "포시가 5mg 84정", author: "회원", date: "2025-07-15" },
    { title: "잘 받았어요 감사합니다", product: "Acivir 5% 10g 4개 - 아시클로버 크림", author: "회원", date: "2025-07-12" },
    { title: "효과 좋네요", product: "이소트레티노인 30mg 300정", author: "회원", date: "2025-07-10" },
    { title: "배송빠르고 좋아요", product: "모르5 MORR5 미녹시딜 5% 60ML x 6박스 인타스", author: "회원", date: "2025-07-08" },
    { title: "가성비 좋아요", product: "센포스200 Cenforce200 실데나필 200mg x 100정 센츄리온", author: "회원", date: "2025-07-05" },
    { title: "좋습니다", product: "비달리스타40 Vidalista40 타다라필 40mg x 200정 센츄리온", author: "회원", date: "2025-07-02" },
    { title: "항상 잘 사용하고 있습니다", product: "피낙스 FINAX 피나스테리드 1mg x 300정 닥터레디스", author: "회원", date: "2025-06-28" },
    { title: "제품 좋아요", product: "수하그라100 Suhagra100 실데나필 100mg x 80정 시플라", author: "회원", date: "2025-06-25" },
    { title: "탈모약 저렴하게 잘 샀습니다", product: "두타놀0.5 Dutanol0.5 두타스테리드 0.5mg x 100정 크놀헬스케어", author: "회원", date: "2025-06-22" },
    { title: "잘 사용하고 있습니다", product: "벤작AC 5% 20g 6개", author: "회원", date: "2025-06-20" },
    { title: "만족스럽습니다", product: "카마그라골드 Kamagra Gold 실데나필 100mg x 16정 아잔타파마", author: "회원", date: "2025-06-18" },
    { title: "배송 2주정도 걸렸어요", product: "모르10 MORR10 미녹시딜 10% 60ML x 6박스 인타스", author: "회원", date: "2025-06-15" },
    { title: "효과 좋습니다 감사합니다", product: "미녹시탑10 MinoxyTop10 미녹시딜 10% 60ML x 6박스 Zeelab", author: "회원", date: "2025-06-12" },
    { title: "재주문이요~", product: "비달리스타60 Vidalista60 타다라필 60mg x 100정 센츄리온", author: "회원", date: "2025-06-10" },
    { title: "잘 도착했습니다", product: "투게인2 Tugain2 여성용 미녹시딜 2% 60ML x 6박스 시플라", author: "회원", date: "2025-06-08" },
    { title: "좋아요 또 살게요", product: "F페시아 F-pesia 피나스테리드 1mg x 300정 시플라", author: "회원", date: "2025-06-05" },
    { title: "피부 좋아졌어요", product: "이브레아 수란트라 크림 Ivrea Cream 이버멕틴 1% 30g x 6개 아잔타파마", author: "회원", date: "2025-06-02" },
    { title: "발모제 효과 있어요", product: "투게인10 Tugain10 바르는 미녹시딜 10% 60ML x 6박스 시플라", author: "회원", date: "2025-05-30" },
    { title: "감사합니다 잘 받았어요", product: "타다라이즈40 Tadarise40 타다라필 40mg x 100정 선라이즈", author: "회원", date: "2025-05-28" },
    { title: "효과 좋아요", product: "힐페시아 Healpecia 피나스테리드 1mg x 100정 힐링파마", author: "회원", date: "2025-05-25" },
    { title: "두번째 구매", product: "아큐파인 ACCUFINE 이소트레티노인20mg x 100정 힐링파마", author: "회원", date: "2025-05-22" },
    { title: "괜찮네요", product: "카마그라 오럴젤리 Kamagra Oral Jelly 실데나필 100mg x 7포 아잔타파마", author: "회원", date: "2025-05-20" },
    { title: "추천합니다", product: "리벨서스 Rybelsus 세마글루타이드 14mg x 30정(3박스) 노보노디스크", author: "회원", date: "2025-05-18" },
    { title: "이용 잘 하고 있습니다", product: "두타놀0.5 Dutanol0.5 두타스테리드 0.5mg x 200정 크놀헬스케어", author: "회원", date: "2025-05-15" },
    { title: "배송 괜찮았어요", product: "포시가 10mg 84정", author: "회원", date: "2025-05-12" },
    { title: "효과 있어요", product: "센포스100 Cenforce100 실데나필 100mg x 40정 센츄리온", author: "회원", date: "2025-05-10" },
    { title: "좋습니다 감사해요", product: "슬림탑 Slimtop 올리스타트120mg x 30정(1박스) 힐링파마", author: "회원", date: "2025-05-08" },
    { title: "재구매 했습니다", product: "모르2 MORR10 미녹시딜 2% 60ML x 6박스 인타스", author: "회원", date: "2025-05-05" },
    { title: "효과좋아요", product: "비달리스타10 Vidalista10 타다라필 10mg x 100정 센츄리온", author: "회원", date: "2025-05-02" },
    { title: "만족합니다", product: "F페시아 F-pesia 피나스테리드 1mg x 600정 시플라", author: "회원", date: "2025-04-28" },
    { title: "잘 쓰고 있습니다", product: "두프로스트 Duprost 두타스테리드 0.5mg x 200정 시플라", author: "회원", date: "2025-04-25" },
    { title: "배송 안전하게 잘 왔어요", product: "수하그라 Suhagra 실데나필 100mg x 40정 시플라", author: "회원", date: "2025-04-22" },
    { title: "두번째 주문", product: "비달리스타40 Vidalista40 타다라필 40mg x 100정 센츄리온", author: "회원", date: "2025-04-20" },
    { title: "좋은 제품이에요", product: "에피듀오겔 30g 2개", author: "회원", date: "2025-04-18" },
    { title: "효과 봤습니다", product: "투게인5 Tugain5 분무형 미녹시딜 5% 60ML x 6박스 시플라", author: "회원", date: "2025-04-15" },
    { title: "잘 받았습니다", product: "피낙스 FINAX 피나스테리드 1mg x 300정 닥터레디스", author: "회원", date: "2025-04-12" },
    { title: "괜찮아요 추천", product: "타다라이즈20 Tadarise20 타다라필 20mg x 100정 선라이즈", author: "회원", date: "2025-04-10" },
    { title: "빠른배송 감사합니다", product: "리벨서스 Rybelsus 세마글루타이드 3mg x 30정(3박스) 노보노디스크", author: "회원", date: "2025-04-08" },
    { title: "좋습니다!", product: "미녹시분5 300정", author: "회원", date: "2025-04-05" },
    { title: "효과 느끼고 있어요", product: "힐페시아 Healpecia 피나스테리드 1mg x 300정 힐링파마", author: "회원", date: "2025-04-02" },
    { title: "만족만족", product: "센포스200 Cenforce200 실데나필 200mg x 40정 센츄리온", author: "회원", date: "2025-03-30" },
    { title: "잘 쓰고 있습니다", product: "이소트레티노인 20mg 300정", author: "회원", date: "2025-03-28" },
    { title: "재구매합니다", product: "카마그라골드 Kamagra Gold 실데나필 100mg x 16정 아잔타파마", author: "회원", date: "2025-03-25" },
    { title: "아주 좋습니다", product: "비달리스타20 Vidalista20 타다라필 20mg x 200정 센츄리온", author: "회원", date: "2025-03-22" },
    { title: "효과있어요", product: "두타놀0.5 Dutanol0.5 두타스테리드 0.5mg x 100정 크놀헬스케어", author: "회원", date: "2025-03-20" },
    { title: "좋아요", product: "포시가 10mg 168정", author: "회원", date: "2025-03-18" },
    { title: "잘 도착했어요", product: "벤작AC 5% 20g 6개", author: "회원", date: "2025-03-15" },
    { title: "추천합니다 좋아요", product: "모르10 MORR10 미녹시딜 10% 60ML x 3박스 인타스", author: "회원", date: "2024-06-10" },
    { title: "앱칼리스 20mg 40정", product: "앱칼리스 20mg 40정", author: "회원", date: "2024-03-25" },
    { title: "아주 좋아요", product: "아큐파인 ACCUFINE 이소트레티노인 20mg x 100정 힐링파마", author: "회원", date: "2024-03-24" },
    { title: "배송 2주 걸렸어요 기대됩니다 또 이용할께요", product: "비달리스타40 Vidalista40 타다라필 40mg x 100정 센츄리온", author: "회원", date: "2024-03-22" },
    { title: "재구매입니다.", product: "비달리스타10 Vidalista10 타다라필10mg x 100정 센츄리온", author: "회원", date: "2024-03-22" },
    { title: "상품이 좋아요.", product: "앱칼리스 20mg 40정", author: "회원", date: "2024-03-22" },
  ];

  const realInfoTitles = [
    "비달리스타 40을 복용했는데 효과가 나타나지 않는 경우 어떻게 해야 하나요?",
    "비달리스타 40을 다른 약물과 함께 복용해도 괜찮나요?",
    "비달리스타 40 복용 시 어떤 부작용이 나타날 수 있나요?",
    "비달리스타 40의 복용법은 어떻게 되나요?",
    "비달리스타 40은 주로 어떤 목적으로 사용되나요?",
    "플라센트렉스 겔을 다른 스킨케어 제품과 함께 사용해도 괜찮을까요?",
    "플라센트렉스 겔 사용 시 부작용이 발생할 수 있나요?",
    "플라센트렉스 겔은 어떻게 사용해야 하나요? 올바른 사용법과 주의사항을 알려주세요.",
    "플라센트렉스 겔은 어떤 피부 고민에 사용할 수 있나요?",
    "플라센트렉스 겔(PLACENTREX Gel)은 어떤 제품이며, 주성분과 주요 효과는 무엇인가요?",
    "센포스100을 복용해도 효과가 나타나지 않는 경우 어떻게 해야 하나요?",
    "센포스100과 다른 약물을 함께 복용해도 괜찮은가요?",
    "센포스100 복용 시 발생할 수 있는 부작용에는 어떤 것들이 있나요?",
    "센포스100은 어떻게 복용해야 하나요? 올바른 복용법을 알려주세요.",
    "센포스100(Cenforce 100)은 어떤 약이고, 주성분과 효과는 무엇인가요?",
    "리벨서스를 다른 당뇨약이나 약물과 함께 복용해도 괜찮을까요?",
    "리벨서스 복용 시 어떤 부작용이 나타날 수 있고, 주의할 점은 무엇인가요?",
    "리벨서스의 올바른 복용법은 어떻게 되나요?",
    "리벨서스는 체중 감량에도 효과가 있나요?",
    "리벨서스(Rybelsus)란 어떤 약이며, 주성분과 효과는 무엇인가요?",
    "포시가를 복용 중인데 다른 약과 함께 먹어도 괜찮나요?",
    "포시가 복용 시 발생할 수 있는 부작용에는 어떤 것이 있나요?",
    "포시가(다파글리플로진)는 어떻게 복용해야 하나요?",
    "포시가가 체중 감량에 도움이 된다고 들었는데, 사실인가요?",
    "포시가(Forxiga)는 어떤 약이며, 어떤 사람들에게 처방되나요?",
    "슬림탑(올리스타트)을 다른 다이어트 보조제나 약물과 함께 복용해도 괜찮을까요?",
    "슬림탑(올리스타트) 복용 시 주의해야 할 부작용에는 어떤 것들이 있나요?",
    "슬림탑(올리스타트)은 어떻게 복용해야 하나요? 올바른 복용법을 알려주세요.",
    "슬림탑(올리스타트)의 체중 감량 효과는 어느 정도인가요?",
    "슬림탑(올리스타트)이란 어떤 약이며, 어떤 원리로 체중 감량에 도움을 주나요?",
    "에피듀오겔을 다른 스킨케어 제품과 함께 사용해도 괜찮나요?",
    "에피듀오겔을 사용하면 언제부터 효과가 나타나나요?",
    "에피듀오겔 사용 시 발생할 수 있는 부작용에는 어떤 것이 있나요?",
    "에피듀오겔은 어떻게 사용해야 하나요? 올바른 사용법을 알려주세요.",
    "에피듀오겔(Epiduo Gel)은 어떤 제품이며 주성분과 효과는 무엇인가요?",
    "이소트레티노인을 다른 약물이나 비타민과 함께 복용해도 괜찮을까요?",
    "이소트레티노인 복용 시 발생할 수 있는 부작용에는 어떤 것들이 있나요?",
    "이소트레티노인은 어떻게 복용해야 하나요? 올바른 복용법을 알려주세요.",
    "이소트레티노인은 어떤 여드름에 효과가 있나요?",
    "이소트레티노인(Isotretinoin)이란 어떤 약이며, 어떤 원리로 여드름을 치료하나요?",
    "벤작AC(과산화벤조일)를 다른 여드름 치료제와 함께 사용해도 되나요?",
    "벤작AC를 사용한 후 피부가 건조하고 따가운데, 어떻게 해야 하나요?",
    "벤작AC 사용 시 주의해야 할 부작용에는 어떤 것이 있나요?",
    "벤작AC(BenzacAC)는 어떻게 사용해야 하나요? 올바른 사용법을 알려주세요.",
    "벤작AC(BenzacAC)란 어떤 제품이며, 어떤 원리로 여드름을 치료하나요?",
    "이브레아 수란트라크림(이버멕틴)을 다른 피부 치료제와 함께 사용해도 괜찮을까요?",
    "이브레아 수란트라크림(이버멕틴) 사용 시 발생할 수 있는 부작용에는 어떤 것들이 있나요?",
    "이브레아 수란트라크림(이버멕틴)은 어떻게 사용해야 하나요? 올바른 사용법을 알려주세요.",
    "이브레아 수란트라크림(이버멕틴)은 어떤 피부 질환에 사용되나요?",
    "이브레아 수란트라크림(이버멕틴)이란 어떤 제품이며, 주요 성분과 효능은 무엇인가요?",
    "Acivir 크림(아시클로버)을 입술 이외의 부위에도 사용할 수 있나요?",
    "Acivir 크림(아시클로버) 사용 시 발생할 수 있는 부작용에는 어떤 것들이 있나요?",
    "Acivir 크림(아시클로버)은 어떻게 사용해야 하나요? 올바른 사용법을 알려주세요.",
    "Acivir 크림(아시클로버)은 어떤 증상에 효과가 있나요?",
    "Acivir 크림(아시클로버 5%)은 어떤 제품이며, 주요 성분과 효능은 무엇인가요?",
    "카마그라 오럴젤리를 다른 약물과 함께 복용해도 괜찮을까요?",
    "카마그라 오럴젤리 복용 시 발생할 수 있는 부작용에는 어떤 것들이 있나요?",
    "카마그라 오럴젤리는 어떻게 복용해야 하나요? 올바른 복용법을 알려주세요.",
    "카마그라 오럴젤리(Kamagra Oral Jelly)의 효과는 얼마나 빨리 나타나며 지속 시간은 어떻게 되나요?",
    "카마그라 오럴젤리(Kamagra Oral Jelly)란 어떤 약이며, 주성분과 효과는 무엇인가요?",
    "타다라이즈를 다른 약물과 함께 복용해도 괜찮은가요?",
    "타다라이즈 복용 시 발생할 수 있는 부작용에는 어떤 것들이 있나요?",
    "타다라이즈의 올바른 복용법은 어떻게 되나요?",
    "타다라이즈의 효과는 얼마나 빨리 나타나며, 지속 시간은 어떻게 되나요?",
    "타다라이즈(Tadarise)란 어떤 약이며, 주성분과 효과는 무엇인가요?",
    "수하그라(실데나필)를 다른 약물과 함께 복용해도 괜찮을까요?",
    "수하그라(실데나필) 복용 시 발생할 수 있는 부작용에는 어떤 것들이 있나요?",
    "수하그라(실데나필)는 어떻게 복용해야 하나요? 올바른 복용법을 알려주세요.",
    "수하그라(실데나필)의 효과는 얼마나 빨리 나타나며, 지속 시간은 어떻게 되나요?",
    "수하그라(Suhagra)란 어떤 약이며, 주성분과 효과는 무엇인가요?",
    "비달리스타(타다라필)를 다른 약물과 함께 복용해도 괜찮을까요?",
    "비달리스타(타다라필)를 복용할 때 발생할 수 있는 부작용은 어떤 것들이 있나요?",
    "비달리스타(타다라필)를 올바르게 복용하는 방법은 무엇인가요?",
    "비달리스타(타다라필)의 효과는 얼마나 빨리 나타나나요?",
    "비달리스타(Vidalista)란 무엇이며, 주성분과 효과는 무엇인가요?",
    "미녹시딜을 사용할 때 주의할 점은 무엇인가요?",
    "미녹시딜 바르는 발모제의 부작용에는 어떤 것들이 있나요?",
    "미녹시딜 바르는 발모제의 올바른 사용법은 어떻게 되나요?",
    "미녹시딜 바르는 발모제의 효과는 얼마나 빨리 나타나나요?",
    "미녹시딜 바르는 발모제란 무엇이며, 어떻게 탈모에 효과가 있나요?",
    "미녹시딜 복용약(미녹시분)을 다른 탈모약과 함께 복용해도 괜찮을까요?",
    "미녹시딜 복용약(미녹시분)을 복용할 때 발생할 수 있는 부작용은 어떤 것들이 있나요?",
    "미녹시딜 복용약(미녹시분)은 어떻게 복용해야 하나요?",
    "미녹시딜 복용약(미녹시분)의 효과는 어떤가요? 바르는 것과 비교했을 때 차이가 있나요?",
    "미녹시딜 복용약(미녹시분)이란 무엇인가요?",
    "두타스테리드를 다른 약물과 함께 복용해도 괜찮을까요?",
    "두타스테리드 복용 시 발생할 수 있는 부작용에는 어떤 것들이 있나요?",
    "두타스테리드는 어떻게 복용해야 하나요?",
    "두타스테리드의 효과는 얼마나 빨리 나타나나요?",
    "두타스테리드란 무엇이며, 어떻게 탈모 치료에 도움이 되나요?",
    "피나스테리드를 다른 탈모약과 함께 복용해도 괜찮을까요?",
    "피나스테리드를 복용하면 발생할 수 있는 부작용은 무엇인가요?",
    "피나스테리드는 어떻게 복용해야 하나요?",
    "피나스테리드의 효과는 얼마나 빨리 나타나나요?",
    "피나스테리드란 무엇이며, 어떻게 탈모를 치료하나요?",
    "투게인10을 사용하면 어느 정도의 기간 후에 효과를 볼 수 있으며, 효과가 없을 경우 어떻게 해야 하나요?",
    "투게인10은 여성도 사용할 수 있나요?",
    "투게인10을 사용할 때 나타날 수 있는 부작용은 무엇인가요?",
    "투게인10은 하루에 몇 번 사용해야 하며 정확한 사용 방법은 무엇인가요?",
    "투게인10은 어떤 제품이며, 주성분과 주요 효과는 무엇인가요?",
  ];

  const realNotices = [
    { title: "[공지] 탈모학교 포인트 적립 안내", content: "탈모학교에서는 모든 상품 구매 시 결제금액의 3%를 포인트로 적립해 드립니다.\n\n적립된 포인트는 다음 주문 시 1포인트 = 1원으로 사용 가능합니다.\n\n포인트 유효기간: 적립일로부터 1년\n최소 사용 포인트: 1,000P\n\n감사합니다.", views: 184, date: "2025-10-23", isNotice: 0 },
    { title: "[공지] 2025년 10월 인도 휴일로 인한 국제 배송 지연 안내", content: "안녕하세요, 탈모학교입니다.\n\n2025년 10월 인도 현지 공휴일(디왈리 축제 등)로 인해 국제 배송이 평소보다 3~5일 정도 지연될 수 있습니다.\n\n주문은 정상적으로 접수되오니, 배송 지연에 양해 부탁드립니다.\n\n감사합니다.", views: 114, date: "2025-10-01", isNotice: 0 },
    { title: "국제 배송 절차", content: "탈모학교 국제 배송 절차 안내\n\n1. 주문 접수 (평일 오전 10시 마감)\n2. 인도 현지 발송 (1~2일 소요)\n3. 국제 운송 (7~14일 소요)\n4. 한국 세관 통관\n5. 국내 택배 배송 (1~2일 소요)\n\n총 소요기간: 약 10~18일\n\n통관 시 개인통관고유부호가 필요할 수 있습니다.\n자세한 사항은 문의 게시판이나 help@talmoschool.com으로 연락 주세요.", views: 134, date: "2025-09-07", isNotice: 1 },
    { title: "탈모학교 글로벌 카드 결제 안내", content: "탈모학교에서는 글로벌 카드 결제를 지원합니다.\n\n사용 가능 카드:\n- VISA\n- MasterCard\n- 국내 신용/체크카드\n\n결제 시 해외 결제로 처리되며, 카드사에 따라 해외 결제 수수료가 부과될 수 있습니다.\n\n결제 관련 문의: help@talmoschool.com", views: 131, date: "2025-09-07", isNotice: 0 },
  ];

  const realEvents = [
    { title: "탈모학교 신규 회원가입 이벤트 안내", content: "탈모학교에 새로 가입하신 회원님께 2,000 포인트를 즉시 적립해 드립니다!\n\n이벤트 기간: 상시\n적립 포인트: 2,000P\n사용 조건: 회원가입 후 즉시 사용 가능\n\n탈모학교와 함께 건강한 생활을 시작하세요!", views: 115, date: "2025-09-12", isNotice: 1 },
    { title: "탈모학교 구매금액의 3% 포인트 적립 안내", content: "탈모학교에서 상품을 구매하시면 결제금액의 3%가 포인트로 적립됩니다.\n\n적립된 포인트는 1P = 1원으로 다음 구매 시 사용 가능합니다.\n\n적립 조건: 상품 구매 확정 시\n유효기간: 적립일로부터 1년\n\n많은 이용 부탁드립니다.", views: 84, date: "2025-09-12", isNotice: 0 },
    { title: "상품 구매 후 리뷰를 남겨주시면 2,000포인트를 적립해드립니다.", content: "탈모학교 상품 구매 후 솔직한 리뷰를 남겨주세요!\n\n리뷰 작성 시 2,000 포인트를 적립해 드립니다.\n\n참여 방법:\n1. 상품 수령 후 고객 리뷰 게시판에 리뷰 작성\n2. 사진 첨부 시 추가 500P 적립\n\n여러분의 소중한 후기가 다른 회원님들께 큰 도움이 됩니다!", views: 90, date: "2025-09-12", isNotice: 0 },
  ];

  const realQAs = [
    { title: "입금 확인이랑 주문번호좀 알려주세요", author: "김순태", views: 18, date: "2026-03-18", content: "입금했는데 주문번호를 모르겠어요. 확인 부탁드립니다." },
    { title: "통관번호는 불필요한가요?", author: "냠냠이", views: 23, date: "2026-03-13", content: "주문할 때 개인통관고유부호를 입력하는 칸이 없는데, 통관번호 없이도 배송이 되나요?" },
    { title: "배송이잘못갔습니다", author: "듀듀", views: 21, date: "2026-03-03", content: "배송이 다른 주소로 갔습니다. 확인 부탁드립니다." },
    { title: "왜답변안해주시냐구요", author: "듀듀", views: 30, date: "2026-02-28", content: "문의 남긴지 꽤 됐는데 답변이 없네요. 확인 부탁합니다." },
    { title: "택배가 안옴 시간이 오래 지났어요", author: "이동춘", views: 39, date: "2026-02-27", content: "주문한지 3주가 넘었는데 아직 배송이 안 됐습니다. 확인 부탁드립니다." },
    { title: "배송", author: "듀듀", views: 28, date: "2026-02-27", content: "배송 언제 출발하나요? 확인 부탁드립니다." },
    { title: "배송문의 합니다", author: "으응", views: 31, date: "2026-02-25", content: "주문한 상품 배송 현황이 궁금합니다. 확인 부탁드립니다." },
    { title: "배송", author: "양민숙", views: 30, date: "2026-02-19", content: "배송 현황 확인 부탁드립니다." },
    { title: "배송문의요", author: "yul남매", views: 103, date: "2026-02-09", content: "주문한 상품이 언제 도착하나요? 배송 추적이 안 됩니다." },
    { title: "세관 수입신고 관련 문의 드립니다", author: "여롱", views: 53, date: "2026-02-02", content: "세관에서 수입신고 관련 서류를 요청하는데, 어떻게 해야 하나요?" },
    { title: "배송 맟 관세청 문의 좀 드립니다.", author: "김승규", views: 91, date: "2026-01-26", content: "배송 현황과 관세청 통관 관련 문의드립니다." },
    { title: "수령방법", author: "스콜피온1001", views: 46, date: "2026-01-20", content: "상품 수령은 어떻게 하나요? 직접 수령도 가능한가요?" },
    { title: "입금확인 및 배송 문의드립니다.", author: "김승규", views: 97, date: "2026-01-08", content: "입금 확인이 안 되는 것 같습니다. 배송도 함께 문의드립니다." },
    { title: "배송문의", author: "이태우", views: 129, date: "2025-12-29", content: "주문한 상품 배송 상태 확인 부탁드립니다." },
    { title: "배송 얼마나 걸릴까묭?", author: "손은채", views: 145, date: "2025-12-15", content: "처음 주문하는데 배송 기간이 얼마나 걸리나요?" },
  ];

  async function ensureRealBoardContent(db: any) {
    try {
      const boardList = await db.select().from(boards);
      if (boardList.length === 0) return;

      const boardMap: Record<string, number> = {};
      for (const b of boardList) {
        boardMap[b.slug] = b.id;
      }

      if (!boardMap["review"]) return;

      const reviewCount = await db.select({ count: sql<number>`count(*)` }).from(posts).where(eq(posts.boardId, boardMap["review"]));
      const currentReviewCount = Number(reviewCount[0]?.count ?? 0);

      if (currentReviewCount >= 85) {
        return;
      }

      const realPostCount = await db.select({ count: sql<number>`count(*)` }).from(posts).where(eq(posts.isAutoGenerated, 0));
      if (Number(realPostCount[0]?.count ?? 0) > 0) {
        return;
      }

      console.log("[AutoSeed] Replacing board content with real crawled data...");

      const adminUser = await db.select().from(users).where(eq(users.email, "admin@talmoschool.com")).limit(1);
      if (adminUser.length === 0) return;
      const adminId = adminUser[0].id;

      await db.delete(posts).where(eq(posts.isAutoGenerated, 1));

      for (const review of realReviews) {
        const reviewDate = new Date(review.date);
        await db.insert(posts).values({
          boardId: boardMap["review"],
          userId: adminId,
          title: review.title,
          content: `[고객 리뷰] ${review.product}\n\n${review.title}`,
          authorName: review.author,
          viewCount: 50 + Math.floor(Math.random() * 200),
          isNotice: 0,
          commentCount: 0,
          likeCount: Math.floor(Math.random() * 10),
          isAutoGenerated: 1,
          createdAt: reviewDate,
          updatedAt: reviewDate,
        });
      }

      for (const title of realInfoTitles) {
        const content = `${title}\n\n이 글에서는 ${title.replace("?", "")}에 대해 자세히 알아보겠습니다.\n\n해당 의약품의 성분, 효능, 복용법, 부작용 등에 대한 정보를 제공합니다.\n\n자세한 사항은 전문 의료인과 상담하시기 바랍니다.\n\n※ 본 정보는 참고용이며, 의사의 처방에 따라 복용하시기 바랍니다.`;
        await db.insert(posts).values({
          boardId: boardMap["info"],
          userId: adminId,
          title,
          content,
          viewCount: 1000 + Math.floor(Math.random() * 800),
          isNotice: 0,
          commentCount: Math.floor(Math.random() * 3),
          likeCount: Math.floor(Math.random() * 15),
          isAutoGenerated: 1,
        });
      }

      for (const notice of realNotices) {
        await db.insert(posts).values({
          boardId: boardMap["notice"],
          userId: adminId,
          title: notice.title,
          content: notice.content,
          viewCount: notice.views,
          isNotice: notice.isNotice,
          commentCount: 0,
          likeCount: 0,
          isAutoGenerated: 1,
        });
      }

      for (const event of realEvents) {
        await db.insert(posts).values({
          boardId: boardMap["event"],
          userId: adminId,
          title: event.title,
          content: event.content,
          viewCount: event.views,
          isNotice: event.isNotice,
          commentCount: 0,
          likeCount: 0,
          isAutoGenerated: 1,
        });
      }

      for (const qa of realQAs) {
        await db.insert(posts).values({
          boardId: boardMap["qna"],
          userId: adminId,
          title: qa.title,
          content: qa.content,
          viewCount: qa.views,
          isNotice: 0,
          commentCount: Math.random() > 0.5 ? 1 : 0,
          likeCount: 0,
          isAutoGenerated: 1,
        });
      }

      console.log(`[AutoSeed] Seeded real board content: ${realReviews.length} reviews, ${realInfoTitles.length} info, ${realNotices.length} notices, ${realEvents.length} events, ${realQAs.length} QA posts.`);
    } catch (err) {
      console.error("[AutoSeed] Failed to seed real board content:", err);
    }
  }

  export async function autoSeedIfEmpty() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) return;

    try {
      const db = drizzle(connectionString);
      const result = await db.select({ count: sql<number>`count(*)` }).from(products);
      const count = Number(result[0]?.count ?? 0);

      await ensureAdminUser(db);
      await ensureTestUsers(db);
      await ensureProductFlags(db);
      await seedBoardsAndPosts(db);
      await ensureRealBoardContent(db);
      await seedPopularKeywords(db);
      await seedDefaultSettings(db);
      await seedPaymentMethods(db);
      await seedDefaultCarriers(db);

      if (count > 0) {
        console.log(`[AutoSeed] Database already has ${count} products, skipping seed.`);
        return;
      }

      console.log("[AutoSeed] No products found, seeding database...");

      const categoryMap: Record<string, number> = {};
      const categoryData = [
        { name: "탈모헤어", slug: "hair-loss", description: "탈모 치료 및 헤어케어 제품", sortOrder: 1 },
        { name: "성기능", slug: "sexual-health", description: "성기능 개선 제품", sortOrder: 2 },
        { name: "피부미용", slug: "skin-beauty", description: "피부미용 및 스킨케어 제품", sortOrder: 3 },
        { name: "다이어트", slug: "diet", description: "다이어트 및 체중관리 제품", sortOrder: 4 },
      ];

      for (const cat of categoryData) {
        const [{ id: catId }] = await db.insert(categories).values({
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          sortOrder: cat.sortOrder,
          isActive: 1,
        }).$returningId();
        categoryMap[cat.name] = catId;
      }

      const usedSlugs = new Set<string>();
      let inserted = 0;

      for (const sp of seedData) {
        const catId = categoryMap[sp.category];
        if (!catId) continue;

        let baseSlug = slugify(sp.title) || `product-${sp.itemId}`;
        if (baseSlug.length > 200) baseSlug = baseSlug.slice(0, 200);
        let slug = baseSlug;
        let suffix = 1;
        while (usedSlugs.has(slug)) {
          slug = `${baseSlug}-${suffix++}`;
        }
        usedSlugs.add(slug);

        const salePrice = sp.originalPrice && sp.originalPrice > sp.price ? sp.price : null;
        const price = sp.originalPrice && sp.originalPrice > sp.price ? sp.originalPrice : sp.price;

        const idx = seedData.indexOf(sp);
        const isBest = idx < 24 ? 1 : 0;
        const isNew = idx >= seedData.length - 30 ? 1 : 0;
        const isFeatured = (idx % 15 === 0) ? 1 : 0;

        try {
          await db.insert(products).values({
            categoryId: catId,
            name: sp.title,
            slug,
            description: sp.subtitle || sp.title,
            content: sp.subtitle || null,
            price,
            salePrice,
            stock: 999,
            images: [sp.imageUrl],
            thumbnail: sp.imageUrl,
            status: "active",
            isFeatured,
            isNew,
            isBest,
            viewCount: Math.floor(Math.random() * 500) + (isBest ? 300 : 0),
            reviewCount: 0,
            pointRate: 3,
            hashtags: [],
          });
          inserted++;
        } catch {
          // skip duplicate
        }
      }

      console.log(`[AutoSeed] Seeded ${inserted} products across ${Object.keys(categoryMap).length} categories.`);
    } catch (err) {
      console.error("[AutoSeed] Failed:", err);
    }
  }

  async function seedBoardsAndPosts(db: any) {
    try {
      const existingBoards = await db.select({ count: sql<number>`count(*)` }).from(boards);
      if (Number(existingBoards[0]?.count ?? 0) > 0) {
        console.log("[AutoSeed] Boards already exist, skipping board seed.");
        return;
      }

      let adminUser = await db.select({ id: users.id }).from(users).limit(1);
      let adminId: number;
      if (adminUser.length === 0) {
        const [{ id: newAdminId }] = await db.insert(users).values({
          name: "탈모학교",
          email: "admin@talmoschool.com",
          role: "admin",
          grade: "vvip",
          points: 0,
          totalSpent: 0,
          openId: "system-admin",
          loginMethod: "email",
        }).$returningId();
        adminId = newAdminId;
      } else {
        adminId = adminUser[0].id;
      }

      const boardData = [
        { slug: "notice", name: "공지사항", description: "탈모학교 공지사항", boardType: "notice" as const, sortOrder: 1 },
        { slug: "event", name: "이벤트", description: "탈모학교 이벤트", boardType: "notice" as const, sortOrder: 2 },
        { slug: "info", name: "정보나눔", description: "건강 정보 및 의약품 정보 공유", boardType: "info" as const, sortOrder: 3 },
        { slug: "qna", name: "질문과답변", description: "상품 문의 및 질문답변", boardType: "qna" as const, sortOrder: 4 },
        { slug: "free", name: "자유게시판", description: "자유로운 소통 공간", boardType: "free" as const, sortOrder: 5 },
        { slug: "review", name: "고객 리뷰", description: "탈모학교 쇼핑 상품 리뷰", boardType: "review" as const, sortOrder: 6 },
      ];

      const boardMap: Record<string, number> = {};
      for (const b of boardData) {
        const [{ id: boardId }] = await db.insert(boards).values({
          slug: b.slug,
          name: b.name,
          description: b.description,
          boardType: b.boardType,
          isActive: 1,
          sortOrder: b.sortOrder,
        }).$returningId();
        boardMap[b.slug] = boardId;
      }

      const noticePosts = [
        { title: "[공지] 탈모학교 포인트 적립 안내", content: "탈모학교에서는 상품 구매 금액의 3%를 포인트로 적립해드립니다.\n\n적립된 포인트는 다음 구매 시 현금처럼 사용하실 수 있습니다.\n\n또한, 상품 리뷰 작성 시 2,000포인트를 추가 적립해드립니다.\n\n많은 이용 부탁드립니다.", viewCount: 184 },
        { title: "[공지] 2025년 10월 인도 휴일로 인한 국제 배송 지연 안내", content: "안녕하세요, 탈모학교입니다.\n\n2025년 10월 인도 현지 휴일(디왈리 등)로 인해 국제 배송이 일시적으로 지연될 수 있습니다.\n\n정상 배송까지 약 7~14일 추가 소요될 수 있으니 양해 부탁드립니다.\n\n감사합니다.", viewCount: 114 },
        { title: "국제 배송 절차", content: "탈모학교 국제 배송 절차 안내\n\n1. 주문 접수 및 결제 확인\n2. 인도 현지 약국에서 상품 수배 (1~2 영업일)\n3. 국제 발송 (항공 특송)\n4. 한국 도착 및 통관 절차 (5~10 영업일)\n5. 국내 택배 배송 (1~2 영업일)\n\n총 배송 소요기간: 약 7~14 영업일\n\n※ 통관 과정에서 개인통관고유번호가 필요합니다.\n※ 관세청 및 식약처 규정에 따라 개인 사용 목적의 의약품은 합법적으로 수입 가능합니다.", viewCount: 134, isNotice: 1 },
        { title: "탈모학교 글로벌 카드 결제 안내", content: "탈모학교에서는 글로벌 카드 결제를 지원합니다.\n\n사용 가능한 결제 수단:\n- 국내 신용카드 (비자, 마스터, JCB)\n- 국내 체크카드\n\n결제 시 해외 결제로 처리되며, 카드사에 따라 해외 결제 수수료가 부과될 수 있습니다.\n\n결제 관련 문의: help@talmoschool.com", viewCount: 131 },
      ];

      const eventPosts = [
        { title: "탈모학교 신규 회원가입 이벤트 안내", content: "탈모학교에 새로 가입하시는 모든 회원분들께 웰컴 포인트를 드립니다!\n\n회원가입만 하시면 즉시 사용 가능한 포인트가 적립됩니다.\n\n지금 바로 가입하시고 혜택을 받아보세요.", viewCount: 115, isNotice: 1 },
        { title: "상품 구매 후 리뷰를 남겨주시면 2,000포인트를 적립해드립니다.", content: "상품을 구매하신 후 솔직한 리뷰를 남겨주세요!\n\n리뷰 1건당 2,000포인트를 적립해드립니다.\n\n사진 포함 리뷰 작성 시 추가 포인트도 적립됩니다.\n\n적립된 포인트는 다음 구매 시 현금처럼 사용 가능합니다.", viewCount: 90 },
        { title: "탈모학교 구매금액의 3% 포인트 적립 안내", content: "탈모학교에서 상품을 구매하시면 구매 금액의 3%가 포인트로 적립됩니다.\n\n적립된 포인트는 다음 구매 시 1포인트 = 1원으로 사용하실 수 있습니다.\n\n많은 이용 부탁드립니다.", viewCount: 84 },
      ];

      const qnaPosts = [
        { title: "입금확인 및 배송진행 처리 요청합니다.", content: "멜라라이트 포르테 크림 Melalite Forte Cream 하이드로퀴논 4% 30g x 3개 주문건에 대해 입금 확인 및 배송 진행 처리 요청합니다.", viewCount: 12 },
        { title: "배송비 포함여부 + 개인통관고유번호 관련 문의", content: "멜라라이트 포르테 크림 구매 시 배송비가 포함된 가격인지, 그리고 개인통관고유번호는 어떻게 입력하는지 문의드립니다.", viewCount: 18 },
        { title: "문의드립니다", content: "이브레아 수란트라 크림 Ivrea Cream 이버멕틴 1% 30g x 3개 제품 관련하여 문의드립니다.", viewCount: 10 },
        { title: "유통기한 문의드립니다", content: "이브레아 수란트라 크림 Ivrea Cream 이버멕틴 1% 30g x 3개 제품의 유통기한이 어떻게 되는지 문의드립니다.", viewCount: 15 },
        { title: "배송기간 문의 입니다", content: "투게인2 Tugain2 여성용 미녹시딜 2% 60ML x 3박스 시플라 제품의 배송 기간이 얼마나 소요되는지 문의합니다.", viewCount: 20 },
        { title: "카마그라 구매 관련", content: "카마그라 오랄젤리 Kamagra OralJelly 실데나필100mg x 35포(5박스) 아잔타파마 제품 구매 관련 문의입니다.", viewCount: 25 },
        { title: "배송문의", content: "주문한 상품의 배송 현황에 대해 문의드립니다. 주문 후 어느 정도 기간이 소요되는지 알고 싶습니다.", viewCount: 14 },
      ];

      const infoTitles = [
        "비달리스타 40을 복용했는데 효과가 나타나지 않는 경우 어떻게 해야 하나요?",
        "비달리스타 40을 다른 약물과 함께 복용해도 괜찮나요?",
        "비달리스타 40 복용 시 어떤 부작용이 나타날 수 있나요?",
        "비달리스타 40의 복용법은 어떻게 되나요?",
        "비달리스타 40은 주로 어떤 목적으로 사용되나요?",
        "비달리스타 20의 복용법과 유의사항은 무엇인가요?",
        "비달리스타 20은 어떤 약물인가요?",
        "비달리스타 10의 주의사항은 무엇인가요?",
        "비달리스타 10의 부작용은 어떤 것이 있나요?",
        "비달리스타 10 복용법과 효과는 어떻게 되나요?",
        "카마그라 오랄젤리 먹는 방법은 어떻게 되나요?",
        "카마그라 오랄젤리 부작용은 어떤 것이 있나요?",
        "카마그라 오랄젤리 효과는 얼마나 지속되나요?",
        "타다리스 SX20 복용 후 부작용은 무엇인가요?",
        "타다리스 SX20 복용법 및 주의사항은?",
        "슈퍼카마그라 오랄젤리 효과와 복용법은?",
        "비달리스타 60을 다른 약물과 함께 복용해도 괜찮나요?",
        "비달리스타 60 복용 시 어떤 부작용이 있을 수 있나요?",
        "비달리스타 60의 복용법은 어떻게 되나요?",
        "비달리스타 60은 어떤 약물이며 어떤 목적으로 사용되나요?",
        "에바스텔 복용 시 주의할 점은 무엇인가요?",
        "에바스텔의 효과는 어떻게 되나요?",
        "에바스텔의 복용 방법은 어떻게 되나요?",
        "미녹시딜 5%와 10%의 차이점은 무엇인가요?",
        "미녹시딜 사용 시 주의사항은?",
        "피나스테리드와 두타스테리드의 차이는?",
        "피나스테리드 1mg와 5mg의 차이는 무엇인가요?",
        "힐페시아 복용 시 부작용 사례는 어떤 게 있나요?",
        "힐페시아는 머리카락이 다시 자라도록 돕나요?",
        "모다피닐 복용법과 주의사항은?",
        "아르모다피닐과 모다피닐의 차이는?",
        "비만 치료제 오르리스타트 효과는?",
        "트레티노인 크림 사용법과 주의사항",
        "하이드로퀴논 크림 사용 시 주의할 점",
        "이버멕틴 크림 피부 사용법",
        "두타스테리드 장기 복용 시 부작용은?",
        "투게인 미녹시딜 2% 여성용 사용법",
        "실데나필과 타다라필의 차이점",
        "센포스 100 복용법과 효과",
        "타다리스 SX20 지속시간은 얼마나 되나요?",
        "카마그라 젤리 vs 정제 차이점",
        "아보다트와 두프로스트 비교",
        "미녹시딜 도포 후 세발 시간은?",
        "피나스테리드 복용 중단 시 어떻게 되나요?",
        "센포스 FM 여성용 효과는?",
        "올리스타트 복용 시 식이요법은?",
        "레티노이드 크림 농도별 차이",
        "비오틴 탈모에 효과가 있나요?",
        "케토코나졸 샴푸 탈모 효과",
        "인도 제네릭 의약품 안전성은?",
      ];

      for (const post of noticePosts) {
        await db.insert(posts).values({
          boardId: boardMap["notice"],
          userId: adminId,
          title: post.title,
          content: post.content,
          viewCount: post.viewCount,
          isNotice: (post as any).isNotice ?? 0,
          commentCount: 0,
          likeCount: 0,
          isAutoGenerated: 1,
        });
      }

      for (const post of eventPosts) {
        await db.insert(posts).values({
          boardId: boardMap["event"],
          userId: adminId,
          title: post.title,
          content: post.content,
          viewCount: post.viewCount,
          isNotice: (post as any).isNotice ?? 0,
          commentCount: 0,
          likeCount: 0,
          isAutoGenerated: 1,
        });
      }

      for (const post of qnaPosts) {
        await db.insert(posts).values({
          boardId: boardMap["qna"],
          userId: adminId,
          title: post.title,
          content: post.content,
          viewCount: post.viewCount,
          isNotice: 0,
          commentCount: 1,
          likeCount: 0,
          isAutoGenerated: 1,
        });
      }

      for (let i = 0; i < infoTitles.length; i++) {
        const title = infoTitles[i];
        const content = `${title}\n\n이 글에서는 ${title.replace("?", "")}에 대해 자세히 알아보겠습니다.\n\n해당 의약품의 성분, 효능, 복용법, 부작용 등에 대한 정보를 제공합니다.\n\n자세한 사항은 전문 의료인과 상담하시기 바랍니다.\n\n※ 본 정보는 참고용이며, 의사의 처방에 따라 복용하시기 바랍니다.`;
        await db.insert(posts).values({
          boardId: boardMap["info"],
          userId: adminId,
          title,
          content,
          viewCount: 1200 + Math.floor(Math.random() * 300),
          isNotice: 0,
          commentCount: Math.floor(Math.random() * 5),
          likeCount: Math.floor(Math.random() * 20),
          isAutoGenerated: 1,
        });
      }

      console.log(`[AutoSeed] Seeded ${boardData.length} boards, ${noticePosts.length} notice posts, ${eventPosts.length} event posts, ${qnaPosts.length} QnA posts, ${infoTitles.length} info posts.`);
    } catch (err) {
      console.error("[AutoSeed] Failed to seed boards/posts:", err);
    }
  }

  async function seedDefaultSettings(db: any) {
    try {
      const defaults = [
        { settingKey: "registrationPoints", settingValue: "2000", description: "회원가입 적립 포인트" },
        { settingKey: "defaultProductPointRate", settingValue: "0", description: "기본 상품 포인트 적립률 (%)" },
      ];
      for (const s of defaults) {
        const existing = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, s.settingKey)).limit(1);
        if (existing.length === 0) {
          await db.insert(siteSettings).values(s).onDuplicateKeyUpdate({ set: { id: sql`id` } });
          console.log(`[AutoSeed] Set default setting: ${s.settingKey} = ${s.settingValue}`);
        }
      }
    } catch (err) {
      console.error("[AutoSeed] Failed to seed default settings:", err);
    }
  }

  async function seedPaymentMethods(db: any) {
    try {
      const existing = await db.select({ count: sql<number>`count(*)` }).from(paymentMethods);
      if (Number(existing[0]?.count ?? 0) > 0) return;

      const stripeApiConfig = JSON.stringify({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
        secretKey: process.env.STRIPE_SECRET_KEY ?? "",
        currency: "jpy",
        webhookSecret: "",
      });

      await db.insert(paymentMethods).values([
        {
          methodCode: "bank_transfer",
          methodName: "무통장 입금",
          isEnabled: 1,
          sortOrder: 1,
          apiConfig: null,
          description: "국내 은행 계좌 이체",
        },
        {
          methodCode: "stripe",
          methodName: "신용카드 (Stripe)",
          isEnabled: 1,
          sortOrder: 2,
          apiConfig: stripeApiConfig,
          description: "Stripe 글로벌 카드 결제",
        },
      ]).onDuplicateKeyUpdate({ set: { id: sql`id` } });

      console.log("[AutoSeed] Seeded default payment methods (bank_transfer + stripe).");
    } catch (err) {
      console.error("[AutoSeed] Failed to seed payment methods:", err);
    }
  }

  async function seedPopularKeywords(db: any) {
    try {
      const existing = await db.select({ count: sql<number>`count(*)` }).from(searchKeywords);
      if (Number(existing[0]?.count ?? 0) > 0) return;

      const keywords = [
        { keyword: "미녹시딜", searchCount: 156 },
        { keyword: "피나스테리드", searchCount: 134 },
        { keyword: "두타스테리드", searchCount: 98 },
        { keyword: "탈모", searchCount: 87 },
        { keyword: "비아그라", searchCount: 76 },
        { keyword: "시알리스", searchCount: 65 },
        { keyword: "다이어트", searchCount: 54 },
        { keyword: "트레티노인", searchCount: 48 },
        { keyword: "여드름", searchCount: 42 },
        { keyword: "비오틴", searchCount: 38 },
        { keyword: "미녹시탑", searchCount: 35 },
        { keyword: "헤어포뮬라", searchCount: 32 },
        { keyword: "발모제", searchCount: 28 },
        { keyword: "센포스", searchCount: 25 },
        { keyword: "오르리스타트", searchCount: 22 },
      ];

      for (const kw of keywords) {
        await db.insert(searchKeywords).values({
          keyword: kw.keyword,
          searchCount: kw.searchCount,
          lastSearchedAt: new Date(),
        }).onDuplicateKeyUpdate({ set: { id: sql`id` } });
      }
      console.log(`[AutoSeed] Seeded ${keywords.length} popular keywords.`);
    } catch (err) {
      console.error("[AutoSeed] Failed to seed keywords:", err);
    }
  }

  async function seedDefaultCarriers(db: any) {
    try {

      const defaultCarriers = [
        { name: "CJ대한통운", code: "cj", trackingUrlTemplate: "https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo={tracking}", isActive: 1, sortOrder: 1 },
        { name: "우체국 EMS", code: "ems", trackingUrlTemplate: "https://service.epost.go.kr/trace.RetrieveEmsRigiTraceList.comm?POST_CODE={tracking}", isActive: 1, sortOrder: 2 },
        { name: "한진택배", code: "hanjin", trackingUrlTemplate: "https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumList={tracking}", isActive: 1, sortOrder: 3 },
        { name: "로젠택배", code: "lotte", trackingUrlTemplate: "https://www.lotteglogis.com/home/reservation/tracking/index?InvNo={tracking}", isActive: 1, sortOrder: 4 },
        { name: "DHL", code: "dhl", trackingUrlTemplate: "https://www.dhl.com/kr-ko/home/tracking.html?tracking-id={tracking}", isActive: 1, sortOrder: 5 },
        { name: "FedEx", code: "fedex", trackingUrlTemplate: "https://www.fedex.com/fedextrack/?trknbr={tracking}", isActive: 1, sortOrder: 6 },
      ];

      for (const carrier of defaultCarriers) {
        await db.insert(shippingCarriers).values(carrier).onDuplicateKeyUpdate({ set: { id: sql`id` } });
      }
      console.log(`[AutoSeed] Seeded ${defaultCarriers.length} default carriers.`);
    } catch (err) {
      console.error("[AutoSeed] Failed to seed carriers:", err);
    }
  }
  
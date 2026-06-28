import { generateNanoId } from "../utils/helper.js";
import urlSchema from "../model/short_url.model.js";
import { saveShortUrl } from "../dao/short_url.js";
import { getCustomShortUrl } from "../dao/short_url.js";

export const createShortUrlWithoutUser = async (url, slug = null, options = {}) => {

  const shortUrl = slug || await generateNanoId(7);
  if(!shortUrl) throw new Error("Short Url Not Generated ")
  const savedUrl = await saveShortUrl(shortUrl,url,null,options);

 return savedUrl;
}

export const createShortUrlWithUser = async (url,userId,slug=null,options = {})=> {

  const shortUrl =  slug || await generateNanoId(7);
  if(!shortUrl) throw new Error("Short Url Not Generated ")

  const exist = await getCustomShortUrl(shortUrl);
  if(exist) throw new Error("Custom Url already exists")
  
   const savedUrl = await saveShortUrl(shortUrl,url,userId,options);

return savedUrl;
}

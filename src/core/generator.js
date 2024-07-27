const { Podcast } = require('podcast');
const { getPublicPosts } = require('./episodeRepo');
const { buildObjectURL, getFileSizeInByte, uploadFile } = require("../minio/utils");

async function updateRss() {
  const podcasts = getPublicPosts();
  const host = config.host;
  const logoUrl = buildObjectURL('logo.jpg')

  const description = 'Два андроїдщики, два Вови і деколи дві різні думки. Кожний подкаст ми обговорюємо нові релізи в світі android розробки, кращі і не дуже практики. Ділимося своїми думками, досвідом і деколи пробуємо не смішно жартувати. Також тут ви знайдете рекомендації початківцям, а хто давно в розробці мають тут просто гарно провести час. Якщо вам тут сподобалося то заходьте в наш telegram chat https://t.me/androidstory_chat Якщо прям сильно сподобалося закиньте там трішки грошей. https://www.patreon.com/androidstory'

  const author = 'Vova and Vova';

  const pubDate = new Date().toUTCString();

  const feed = new Podcast({
    title: 'Android story',
    description: description,
    feedUrl: buildObjectURL('rss.xml'),
    siteUrl: host,
    webMaster: host,
    generator: 'Android story',
    imageUrl: logoUrl,
    author: author,
    copyright: '© 2022 Android story',
    language: 'ua',
    categories: ['Technology'],
    pubDate: pubDate,
    ttl: 60,
    itunesAuthor: author,
    itunesType: 'episodic',
    itunesSummary: description,
    itunesOwner: { name: author, email: 'vovochkastelmashchuk@gmail.com' },
    itunesExplicit: false,
    itunesCategory: [{
      text: 'Technology',
    }, {
      text: 'News',
      subcats: [{
        text: 'Tech News',
      }],
    }],
    itunesImage: logoUrl,
  });

  const fileSizes = await Promise.all(podcasts.map(post =>
    getFileSizeInByte('episodes/' + post.audio_file_key)
  ));

  const podcastsUrl = await Promise.all(podcasts.map(post =>
    buildObjectURL('episodes/' + post.audio_file_key)
  ));

  const podcastCount = podcasts.length;

  podcasts.forEach((post, index) => {
    let description = buildDescription(post);

    let linkToEpisode = `${config.host}/podcast/${post.slug}`;

    let guid = post.id.toString();

    let date = post.publish_date.toISOString();

    const duration = post.duration;

    feed.addItem({
      title: post.title,
      description: description,
      url: linkToEpisode,
      guid: guid,
      date: date,
      enclosure: {
        url: podcastsUrl[index],
        size: fileSizes[index],
      },
      itunesTitle: post.title,
      itunesDuration: duration,
      itunesExplicit: false,
      itunesEpisodeType: 'full',
      itunesSeason: 2,
      itunesEpisode: podcastCount - index,
      itunesImage: logoUrl,
      itunesAuthor: author,
      itunesSummary: description,
    });
  });

  await uploadFile('rss_1.xml', feed.buildXml());
}

function buildDescription(post) {
  let description = 'В цьому випуску ';
  if (post.charters) {
    description += '<ul>'
    post.charters.forEach(chapter => {
      description += `<li>${chapter.time} - <em>${chapter.description}</em></li>`;
    });
    description += '</ul>'
  }

  if (post.links) {
    description += '<br>';
    description += '<h3>Згадано в випуску</h3>';
    description += '<ul>'
    post.links.forEach(link => {
      description += `<a href="${link.link}">${link.title}</a>`;
      description += '<br>';
    });
    description += '</ul>'
  }

  return description
}

function buildYoutbeDescription(post) {
  let description = 'В цьому випуску \n';
  if (post.charters) {
    post.charters.forEach(chapter => {
      description += `${chapter.time} - ${chapter.description} \n`;
    });
    description += ''
  }

  if (post.links) {
    description += '\n';
    description += 'Згадано в випуску \n';
    post.links.forEach(link => {
      description += `${link.link}`;
      description += '\n';
    });
  }

  return description
}

module.exports = {
  updateRss,
  buildYoutbeDescription,
}

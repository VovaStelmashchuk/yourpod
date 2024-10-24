import { Database } from "./client.js";

export function getPublicPosts(showSlug) {
  return Database.collection('posts').find(
    {
      'visibility': 'public',
      'showSlug': showSlug
    },
    {
      sort: {
        'publish_date': -1
      }
    }
  ).toArray();
}

export function getPodcastForRss(showSlug) {
  return Database.collection('posts').find(
    {
      'showSlug': showSlug,
      'visibility': 'public',
      'type': 'public'
    },
    {
      sort: {
        'publish_date': -1
      }
    }
  ).toArray();
}

export function getAllPosts(showSlug) {
  return Database.collection('posts').find(
    {
      'showSlug': showSlug
    },
    {
      sort: {
        'publish_date': -1
      }
    }
  ).toArray();
}

export function updatePodcastNameBySlug(showSlug, episodeSlug, podcastName) {
  return Database.collection('posts').updateOne(
    {
      showSlug: showSlug,
      slug: episodeSlug
    },
    {
      $set: { title: podcastName }
    }
  );
}

export function updateVideoPathBySlug(showSlug, episodeSlug, videoPath) {
  return Database.collection('posts').updateOne(
    {
      showSlug: showSlug,
      slug: episodeSlug
    },
    {
      $set: { videoPath: videoPath }
    }
  );
}
export function updatePublicAudio(showSlug, episodeSlug, publicAudioFile) {
  return Database.collection('posts').updateOne(
    {
      showSlug: showSlug,
      slug: episodeSlug
    },
    {
      $set: { publicAudioFile: publicAudioFile }
    }
  );
}

export function updateAudioPathBySlug(showSlug, episodeSlug, audioPath) {
  return Database.collection('posts').updateOne(
    {
      showSlug: showSlug,
      slug: episodeSlug
    },
    {
      $set: { audioPath: audioPath }
    }
  );
}

export function updateTimeCodeBySlug(showSlug, episodeSlug, index, time, description, isPublicValue) {
  const timeInSeconds = time.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
  return Database.collection('posts').updateOne(
    {
      showSlug: showSlug,
      slug: episodeSlug
    },
    {
      $set: {
        [`charters.${index}.time`]: time,
        [`charters.${index}.description`]: description,
        [`charters.${index}.isPublic`]: isPublicValue,
        [`charters.${index}.timeInSeconds`]: timeInSeconds,
      }
    }
  );
}

export function updateLinkBySlug(showSlug, episodeSlug, index, link, text) {
  return Database.collection('posts').updateOne(
    {
      showSlug: showSlug,
      slug: episodeSlug
    },
    {
      $set: {
        [`links.${index}.link`]: link,
        [`links.${index}.text`]: text,
      }
    }
  );
}

export function getPostBySlug(showSlug, episodeSlug) {
  return Database.collection('posts').findOne({ slug: episodeSlug, showSlug: showSlug });
}

export function updateMontageStatusBySlug(showSlug, episodeSlug, status) {
  return Database.collection('posts').updateOne({ slug: episodeSlug, showSlug: showSlug }, { $set: { montage_status: status } });
}


export function publishPodcast(showSlug, episodeSlug) {
  return Database.collection('posts').updateOne({ showSlug: showSlug, slug: episodeSlug }, { $set: { visibility: 'public' } });
}

export function unpublishPodcast(showSlug, episodeSlug) {
  return Database.collection('posts').updateOne({ showSlug: showSlug, slug: episodeSlug }, { $set: { visibility: 'private' } });
}

export function createPodcast(showSlug, name, slug, links) {
  return Database.collection('posts').insertOne({
    showSlug: showSlug,
    title: name,
    slug: slug,
    links: links,
    charters: [],
    visibility: 'private',
    publish_date: new Date(),
    type: 'public',
  });
}



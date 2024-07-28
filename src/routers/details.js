const { getPostBySlug } = require("../core/episodeRepo");
const { buildObjectURL } = require("../minio/utils");
const { buildPublicChapters } = require("../core/generator");

async function podcastDetailsHandler(request, h) {
  const slug = request.params.slug;
  const preview = request.query.preview;

  const layout = preview === 'true' ? false : 'layout';

  const podcast = await getPostBySlug(slug);

  const publicChapters = buildPublicChapters(podcast.charters)

  return h.view('podcastDetails',
    {
      title: podcast.title,
      audioUrl: buildObjectURL('episodes/' + podcast.audio_file_key),
      chapters: publicChapters
        .map(chapter => {
          return {
            time: chapter.time,
            title: chapter.description,
            timeInSeconds: chapter.time.split(':').reduce((acc, time) => (60 * acc) + +time)
          }
        }
        ),
      links: podcast.links.map(link => {
        return {
          link: link.link,
          title: link.title,
        }
      }
      )
    },
    {
      layout: layout
    }
  );
}

function podcastDetails(server) {
  server.route({
    method: 'GET',
    path: '/podcast/{slug}',
    handler: podcastDetailsHandler,
    options: {
      auth: false
    }
  });
}

module.exports = {
  podcastDetails
};

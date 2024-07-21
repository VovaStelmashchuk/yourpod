const {getPostBySlug} = require("../core/episodeRepo");
const {buildObjectURL} = require("../minio/utils");

async function podcastDetailsHandler(request, h) {
  const slug = request.params.slug;

  const podcast = await getPostBySlug(slug);

  return h.view('podcastDetails', {
      imageUrl: "",
      title: podcast.title,
      audioUrl: buildObjectURL('episodes/' + podcast.audio_file_key),
      chapters: podcast.charters.map(chapter => {
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
    }, {
      layout: 'layout'
    }
  );
}

function podcastDetails(server) {
  server.route({method: 'GET', path: '/podcast/{slug}', handler: podcastDetailsHandler});
}

module.exports = {
  podcastDetails
};
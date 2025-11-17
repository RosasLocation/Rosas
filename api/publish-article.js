// api/publish-article.js

import OpenAI from "openai";

// 1) Tableau de sujets SEO + Pinterest
const topics = [
  {
    id: 1,
    theme: "plages",
    keyword: "plage familiale à Rosas",
    seoTitle: "Plage familiale à Rosas : une journée simple et douce en bord de mer",
    h1: "Plage familiale à Rosas : une journée simple et douce en bord de mer",
    h2Sections: [
      "Préparer une journée de plage sans stress",
      "Les petits plaisirs à partager en famille",
      "Quand la lumière tombe sur la mer"
    ],
    pinterestTitle: "Idée de journée plage en famille à Rosas",
    pinterestTextOverlay: "Journée plage en famille à Rosas",
    pinterestDescription:
      "Une journée simple et chaleureuse à la plage en famille à Rosas, Espagne : ambiance, sensations et petits moments à savourer."
  },
  {
    id: 2,
    theme: "gastronomie",
    keyword: "découvrir la gastronomie catalane à Rosas",
    seoTitle: "Goûter à la gastronomie catalane à Rosas sans se prendre au sérieux",
    h1: "Goûter à la gastronomie catalane à Rosas sans se prendre au sérieux",
    h2Sections: [
      "Le premier café qui sent déjà les vacances",
      "Partager des petites choses à picorer",
      "Ces gestes qui font une table catalane"
    ],
    pinterestTitle: "Gastronomie catalane à Rosas : ambiance, pas prise de tête",
    pinterestTextOverlay: "Ambiance tapas à Rosas",
    pinterestDescription:
      "Un article sensible et gourmand sur la gastronomie catalane à Rosas : odeurs, gestes, moments à partager en vacances."
  },
  {
    id: 3,
    theme: "famille",
    keyword: "vacances en famille à Rosas",
    seoTitle: "Vacances en famille à Rosas : ces petits chaos qui font les grands souvenirs",
    h1: "Vacances en famille à Rosas : ces petits chaos qui font les grands souvenirs",
    h2Sections: [
      "Avant de partir : le bazar organisé",
      "Une journée à Rosas vue par les enfants",
      "Le soir, quand tout le monde ralentit"
    ],
    pinterestTitle: "Vacances en famille à Rosas : le joli chaos",
    pinterestTextOverlay: "Vacances en famille à Rosas",
    pinterestDescription:
      "Vacances en famille à Rosas : un récit tendre et drôle sur le joli chaos des séjours en bord de mer."
  },
  {
    id: 4,
    theme: "randonnée",
    keyword: "balade autour de Rosas",
    seoTitle: "Balades autour de Rosas : marcher sans performance, juste pour voir",
    h1: "Balades autour de Rosas : marcher sans performance, juste pour voir",
    h2Sections: [
      "L’art de partir trop tard mais quand même",
      "Marcher, parler, se taire, recommencer",
      "Revenir avec du vent dans les cheveux"
    ],
    pinterestTitle: "Balades autour de Rosas : marcher pour le plaisir",
    pinterestTextOverlay: "Balades autour de Rosas",
    pinterestDescription:
      "Une balade autour de Rosas racontée façon récit : lumières, chemins, conversations et plaisirs simples."
  },
  {
    id: 5,
    theme: "loisirs",
    keyword: "que faire à Rosas en vacances",
    seoTitle: "Que faire à Rosas en vacances quand on n’a pas envie de courir partout",
    h1: "Que faire à Rosas en vacances quand on n’a pas envie de courir partout",
    h2Sections: [
      "Accepter de ne pas tout faire",
      "Choisir une activité par jour, pas plus",
      "Ces petits rituels qui deviennent des souvenirs"
    ],
    pinterestTitle: "Idées d’activités à Rosas sans se presser",
    pinterestTextOverlay: "Idées à faire à Rosas",
    pinterestDescription:
      "Des idées d’activités à Rosas pour des vacances douces, sans planning militaire ni course aux visites."
  }
  // 👉 Tu peux ajouter d’autres topics ici selon ta stratégie.
];

// 2) Rotation automatique des sujets tous les 4 jours
function pickTopicByDate(date = new Date()) {
  const baseDate = new Date("2025-01-01T00:00:00Z");
  const diffMs = date.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const index = Math.floor(diffDays / 4); // 1 article tous les 4 jours
  const topicIndex = ((index % topics.length) + topics.length) % topics.length;
  return topics[topicIndex];
}

export default async function handler(req, res) {
  try {
    // 3) Client OpenAI
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // 4) Surcharge possible via query ?theme=&keyword=
    const themeFromQuery =
      (req.query?.theme || "").toString().toLowerCase().trim();
    const keywordFromQuery = (req.query?.keyword || "").toString().trim();

    let topic = pickTopicByDate();

    if (themeFromQuery || keywordFromQuery) {
      const found = topics.find((t) => {
        const themeMatch =
          themeFromQuery && t.theme.toLowerCase() === themeFromQuery;
        const keywordMatch =
          keywordFromQuery &&
          t.keyword.toLowerCase() === keywordFromQuery.toLowerCase();
        return themeMatch || keywordMatch;
      });
      if (found) topic = found;
    }

    // 5) PROMPT : style Juliette Arnaud + structure SEO + angle Pinterest
    const prompt = `
Tu es autrice d'articles de blog en français.

Objectif :
Écrire un article de 800 à 1 100 mots qui donne envie de séjourner à Rosas, en Espagne, en gardant un style très incarné, narratif et sensible. Le ton doit rappeler l'écriture de Juliette Arnaud : oral, tendre, un peu théâtral, avec des images précises et quelques digressions qui font sourire.

Le sujet général de l'article est : "${topic.theme}" à Rosas.
Le mot-clé principal à intégrer naturellement dans le texte est : "${topic.keyword}".

Contraintes de forme :
- Génère du HTML UNIQUEMENT pour le corps de l'article (sans <html>, <head> ni <body>).
- Utilise :
  - un seul <h1> avec exactement ce texte : "${topic.h1}"
  - 3 à 5 sous-titres <h2>, en reprenant ou adaptant ces idées de section :
    ${topic.h2Sections.join(" / ")}
  - des paragraphes <p> courts (3 à 5 lignes maximum).
  - éventuellement quelques listes <ul><li>…</li></ul> pour les moments pratiques ou les petites listes de sensations.

Contraintes sur le mot-clé :
- Intègre l'expression "${topic.keyword}" 2 à 4 fois dans l'article.
- Elle doit apparaître de manière fluide, dans des phrases naturelles, sans liste ni répétition artificielle.

Contraintes de fond :
- Parle de Rosas et de l'Espagne de manière générale : mer, lumière, ambiance, gestes du quotidien.
- Pas de dates, pas de prix, pas de chiffres.
- Pas de noms exacts de restaurants, d'hôtels, de monuments ni de personnes.
- Ne cite pas d'informations historiques précises.
- L'article doit rester centré sur les sensations, les scènes de vie et le vécu imaginaire d'un séjour à Rosas.

Style :
- Rythme oral, phrases plutôt courtes, avec parfois des ruptures pour l'effet comique ou sensible.
- Humour discret mais présent.
- Beaucoup d'images concrètes (odeurs, lumière, bruits, textures).
- Adresse directe au lecteur possible ("tu", "vous") avec parcimonie.

Pinterest :
- Dans le premier tiers de l'article, écris un paragraphe très visuel qui pourrait servir de base à un visuel de Pin (on doit voir clairement la scène).
- Insère quelque part dans le texte une phrase courte, forte et inspirante (une seule phrase) qui pourrait être utilisée comme texte sur l'image d'un pin.

Fin :
- Ne termine pas par "En conclusion" ou équivalent.
- Termine sur une image, une sensation ou une phrase qui laisse le lecteur dans l'ambiance de Rosas.

Rappels :
- Écris tout en français.
- Ne commente pas ce que tu fais, ne résume pas : produis directement le HTML de l'article.
    `.trim();

    // 6) Appel à l'API OpenAI
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    const articleContent = response.output_text?.trim();
    if (!articleContent) {
      return res.status(500).json({ error: "Aucun texte généré par OpenAI" });
    }

    // 7) Publication sur WordPress
    const wpUser = process.env.WP_API_USER;
    const wpPassword = process.env.WP_API_PASSWORD;
    const wpUrl = process.env.WP_API_URL; // /wp-json/wp/v2/posts

    const authString = Buffer.from(`${wpUser}:${wpPassword}`).toString("base64");

    const wpResponse = await fetch(wpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`
      },
      body: JSON.stringify({
        title: topic.seoTitle,
        content: articleContent,
        status: "publish",
        // 👇 Image mise en avant par défaut (ID = 12926)
        featured_media: 12926
      })
    });

    if (!wpResponse.ok) {
      const text = await wpResponse.text();
      console.error("Erreur WordPress:", text);
      return res
        .status(500)
        .json({ error: "Erreur côté WordPress", details: text });
    }

    const wpPost = await wpResponse.json();

    // 8) Réponse JSON enrichie (utile pour Make.com / Pinterest)
    return res.status(200).json({
      success: true,
      topicId: topic.id,
      theme: topic.theme,
      keyword: topic.keyword,
      postId: wpPost.id,
      link: wpPost.link,
      title: wpPost.title?.rendered,
      pinterest: {
        title: topic.pinterestTitle,
        textOverlay: topic.pinterestTextOverlay,
        description: topic.pinterestDescription
      }
    });
  } catch (err) {
    console.error("Erreur API:", err);
    return res
      .status(500)
      .json({ error: "Erreur serveur", details: String(err) });
  }
}

// api/generate-landing.js
// Génère une "landing" optimisée SEO + conversion, publiée comme ARTICLE WordPress.

import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 1) Lire les paramètres de l'URL
    const sujetRaw = (
      req.query && req.query.sujet ? req.query.sujet : ""
    )
      .toString()
      .trim();
    const keywordRaw = (
      req.query && req.query.keyword ? req.query.keyword : ""
    )
      .toString()
      .trim();
    const langRaw = (
      req.query && req.query.lang ? req.query.lang : "fr"
    )
      .toString()
      .toLowerCase()
      .trim();

    const isEnglish = langRaw === "en";

    const sujet =
      sujetRaw ||
      (isEnglish
        ? "seaview apartment rental in Roses, Spain directly from owner"
        : "location front de mer à Rosas en direct propriétaire");

    const keyword =
      keywordRaw ||
      (isEnglish
        ? "book seaview apartment Roses Spain"
        : "location front de mer Roses direct propriétaire");

    // 2) Prompt en fonction de la langue (version finale premium)
    const prompt = isEnglish
      ? `
Write a landing page in English of about 550 words.

Topic: ${sujet}
Main transactional keyword: "${keyword}".

Tone and style:
- Warm, soft, premium, human, with gentle sensory details.
- Calm, elegant, reassuring, like a thoughtful and welcoming host.
- Subtle imagery, clarity first, no commercial push.
- Smooth transitions, short to medium sentences.
- No poetic overflow, no heavy humor, no corporate tone.

Goal:
- Make the reader feel the peaceful experience of staying in Roses.
- Build trust as a direct-owner host who cares.
- Encourage booking without pressure.
- Highlight the benefits of direct booking: serenity, comfort, no commission.

Strict constraints:
- No dates, prices, numbers, addresses, brand names.
- No exact place names, no beaches, no restaurants, no landmarks.
- No historical facts.
- No verifiable or precise real-world details.
- No bullet lists, paragraphs <p> only.

Required HTML structure:
- <h1> with a natural, elegant, keyword-containing title.
- Several <h2> sections with soft guiding tone.
- Narrative <p> paragraphs with sensory warmth.
- A "3 advantages" block: three consecutive <p> paragraphs starting with:
    Advantage 1:
    Advantage 2:
    Advantage 3:
- A short first-person "testimonial" <p>.
- Two CTAs as <p>:
    1) Link to https://www.location-rosas.fr/en/booking/
       (may mention https://www.location-rosas.fr/en/rates/)
    2) WhatsApp link:
       https://api.whatsapp.com/send/?phone=33632470724&text=Hello%2C+I%20would%20like%20to%20book%20a%20stay%20in%20Roses&type=phone_number&app_absent=0
- One reassurance paragraph:
    "direct booking with the owner", "no commission", "secure online payment, like Stripe or similar services".

Automatic SEO to include:
- Generate a <meta-title> with the main keyword + one soft benefit.
- Generate a <meta-description> under 150 characters, warm, natural, containing the keyword once and no over-optimization.

Output:
- Clean HTML: <h1>, <h2>, <p>, <meta-title>, <meta-description>.
- A coherent, premium, human, reassuring landing page.
      `.trim()
      : `
Écris une landing page en français d'environ 550 mots.

Sujet : ${sujet}
Mot-clé principal (transactionnel) : « ${keyword} ».

Style attendu :
- Ton chaleureux, apaisant, premium, avec une douceur naturelle.
- Sensations subtiles, images lumineuses, détails sensoriels délicats.
- Une voix humaine, simple, accueillante, rassurante, jamais commerciale.
- Petites touches émotionnelles, clarté élégante, transitions fluides.
- Pas de digressions trop littéraires. Pas d'humour lourd. Pas de surcharge poétique.

Objectif :
- Faire ressentir la tranquillité d'un séjour à Rosas.
- Rassurer le lecteur comme un propriétaire bienveillant et sincère.
- Donner envie de réserver, sans pression.
- Mettre en avant l'expérience : calme, vue mer, simplicité, confort.
- Souligner discrètement les bénéfices du "direct propriétaire, sans commission".

Contraintes strictes :
- Aucune date, aucun prix, aucun chiffre, aucune adresse, aucun nom de marque.
- Aucun lieu précis, aucun monument, aucun quartier nommé.
- Aucun fait historique.
- Aucun élément vérifiable (restaurants, noms propres, plages, entités réelles).
- Pas de listes en puces, uniquement des paragraphes <p>.
- Pas de ton commercial agressif.

Structure HTML attendue :
- <h1> : titre principal impactant, naturel, élégant, contenant le mot-clé de manière fluide.
- Plusieurs <h2> structurants, doux et rassurants.
- Paragraphes <p> narratifs, sensoriels, humains.
- Bloc "3 avantages" : trois paragraphes <p> consécutifs commençant par :
    Avantage 1 :
    Avantage 2 :
    Avantage 3 :
- Un témoignage court en <p>, écrit à la première personne (sans fait précis).
- Deux CTA en <p> :
    1) Lien cliquable vers https://www.location-rosas.fr/reserver/
       (peut mentionner https://www.location-rosas.fr/tarifs/)
    2) Lien WhatsApp cliquable vers :
       https://api.whatsapp.com/send/?phone=33632470724&text=Bonjour%2C+je+souhaite+r%C3%A9server+un+s%C3%A9jour+%C3%A0+Rosas&type=phone_number&app_absent=0
- Un paragraphe de réassurance mentionnant :
    « réservation en direct avec le propriétaire », 
    « sans commission », 
    « paiement sécurisé, comme avec Stripe ou un service équivalent ».

SEO automatique (à inclure en début ou fin du texte) :
- Génère un <meta-title> contenant le mot-clé principal + un bénéfice.
- Génère une <meta-description> de 150 caractères max, claire, naturelle, chaleureuse, sans sur-optimisation, contenant le mot-clé une seule fois.

Sortie attendue :
- du HTML propre : <h1>, <h2>, <p>, <meta-title>, <meta-description>.
- un texte cohérent, simple, premium et rassurant.
      `.trim();

    // 3) Appel OpenAI
    const aiResponse = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const content = aiResponse.output_text ? aiResponse.output_text.trim() : "";
    if (!content) {
      return res.status(500).json({ error: "Aucun texte généré par OpenAI" });
    }

    // 4) Extraire un titre à partir du premier <h1> ou de la première ligne
    let title = "";
    const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      title = h1Match[1].trim();
    } else {
      const firstLine =
        content.split("\n").find((l) => l.trim().length > 0) || "";
      title =
        firstLine.trim().slice(0, 80) ||
        (isEnglish
          ? "Seaview stay in Roses, Spain"
          : "Location front de mer à Rosas");
    }

    // 5) Appel WordPress : on publie comme ARTICLE (posts) pour rester simple
    const wpUser = process.env.WP_API_USER;
    const wpPassword = process.env.WP_API_PASSWORD;
    const wpPostsUrl = process.env.WP_API_URL; // doit déjà pointer vers /wp-json/wp/v2/posts

    if (!wpUser || !wpPassword || !wpPostsUrl) {
      return res
        .status(500)
        .json({ error: "Config WordPress manquante (env vars)" });
    }

    const authString = Buffer.from(`${wpUser}:${wpPassword}`).toString(
      "base64"
    );

    const wpResponse = await fetch(wpPostsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify({
        title,
        content,
        status: "publish",
      }),
    });

    if (!wpResponse.ok) {
      const text = await wpResponse.text();
      console.error("Erreur WordPress (generate-landing):", text);
      return res.status(500).json({
        error: "Erreur côté WordPress (generate-landing)",
        details: text,
      });
    }

    const wpPost = await wpResponse.json();

    return res.status(200).json({
      success: true,
      type: "landing-post",
      lang: isEnglish ? "en" : "fr",
      sujet,
      keyword,
      postId: wpPost.id,
      link: wpPost.link,
      title:
        wpPost.title && wpPost.title.rendered
          ? wpPost.title.rendered
          : title,
    });
  } catch (err) {
    console.error("Erreur API generate-landing:", err);
    return res.status(500).json({
      error: "Erreur serveur generate-landing",
      details: String(err),
    });
  }
}

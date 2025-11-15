// pages/api/publish-article.js

import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    // 1) Instancier le client OpenAI avec la clé depuis Vercel
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 2) Demander à OpenAI un article 300–500 mots sur Rosas
    const prompt = `
Écris un article de 300 à 500 mots en français sur Rosas en Espagne.
Parle du tourisme, des activités, de la gastronomie locale et de la culture catalane.
Style : vivant, accessible, chaleureux, mais sans invention factuelle précise
(pas de dates, pas de prix, pas de chiffres exacts).
Écris pour des familles francophones qui cherchent une location de vacances à Rosas.
Ne parle pas de politique, pas de sujets sensibles.
    `.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini", // tu peux mettre gpt-4.1 ou un autre modèle premium si tu veux
      input: prompt,
    });

    const articleContent = response.output_text?.trim();
    if (!articleContent) {
      return res.status(500).json({ error: "Aucun texte généré par OpenAI" });
    }

    // 3) Construire le titre (simplement les 8–10 premiers mots)
    const firstLine = articleContent.split("\n")[0];
    const words = firstLine.split(" ").slice(0, 10).join(" ");
    const title = words || "Article sur Rosas généré automatiquement";

    // 4) Préparer la requête vers WordPress
    const wpUser = process.env.WP_API_USER;
    const wpPassword = process.env.WP_API_PASSWORD;
    const wpUrl = process.env.WP_API_URL;

    const authString = Buffer.from(`${wpUser}:${wpPassword}`).toString("base64");

    const wpResponse = await fetch(wpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify({
        title,
        content: articleContent,
        status: "publish",
      }),
    });

    if (!wpResponse.ok) {
      const text = await wpResponse.text();
      console.error("Erreur WordPress:", text);
      return res
        .status(500)
        .json({ error: "Erreur côté WordPress", details: text });
    }

    const wpPost = await wpResponse.json();

    // 5) Répondre avec les infos de l’article créé
    return res.status(200).json({
      success: true,
      postId: wpPost.id,
      link: wpPost.link,
      title: wpPost.title?.rendered,
    });
  } catch (err) {
    console.error("Erreur API:", err);
    return res.status(500).json({ error: "Erreur serveur", details: String(err) });
  }
}

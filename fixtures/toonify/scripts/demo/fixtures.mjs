import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export function createDemoApi(root) {
  const stamp = '2026-01-07T12:00:00Z';
  const artwork = '/images/styles/cyberpunk.png';
  const worldview = { title: 'A city built on forgotten memories', content: 'In a neon-lit harbor, memories are traded as currency. A young courier discovers a message from the city before it vanished.', tone: ['Mysterious', 'Hopeful'], key_features: ['Memories power the neon city', 'A courier with a missing past', 'Every delivery changes the future'] };
  const projects = [{ id: 'neon-harbor', title: 'Neon Harbor', subtitle: 'Every memory has a price', description: worldview.content, genre: 'Fantasy', genres: ['Fantasy', 'Mystery'], style_preset: 'cyberpunk', art_style: 'Cinematic cyberpunk webtoon with neon violet and cyan lighting', style_reference_url: artwork, thumbnail_url: '/images/mock/hero_bg.png', cover_image_status: 'completed', suggestions_status: 'completed', worldview, created_at: stamp, updated_at: stamp }];
  const stats = { strength: 65, intelligence: 85, charisma: 80, luck: 70, empathy: 90, leadership: 75 };
  const characters = [{ id: 'luna', project_id: 'neon-harbor', name: 'Luna', description: 'A resourceful courier searching for her lost memories.', profile_image_url: '/images/styles/anime-style.png', sheet_status: 'completed', default_mood: ['Curious', 'Brave'], appearance_tags: ['Silver hair', 'Neon jacket', 'Memory pendant'], profile: { age: '22', personality: 'Curious, brave, empathetic', background: 'Raised among the floating docks of Neon Harbor.', bio: { origin: 'The floating docks', goals: 'Recover her lost memories', quirk: 'Collects broken radios' }, stats } }, { id: 'kai', project_id: 'neon-harbor', name: 'Kai', description: 'A quiet archivist who remembers the city before the blackout.', profile_image_url: '/images/styles/semi-realism.png', sheet_status: 'completed', default_mood: ['Calm', 'Loyal'], appearance_tags: ['Archivist', 'Long coat'], profile: { age: '25', personality: 'Calm, analytical', stats } }];
  const episodes = [{ id: 'first-delivery', project_id: 'neon-harbor', title: 'The First Delivery', episode_order: 1, story_summary: 'Luna accepts a mysterious package and follows its signal into the rain.', status: 'ready', created_at: stamp, thumbnail_url: artwork, first_cut_image: artwork, cuts_count: 3 }];
  const cuts = [
    { id: 'cut-1', script: 'Establishing shot: neon lights reflect across the rain-soaked harbor. Luna steps onto the floating dock.', image_path: artwork, aspect_ratio: '16:9' },
    { id: 'cut-2', script: 'Close-up: a sealed memory capsule pulses with violet light in Luna’s hand.', image_path: '/images/styles/noir.png', aspect_ratio: '4:3' },
    { id: 'cut-3', script: 'Across the skyline, a forgotten tower wakes for the first time in twenty years.', image_path: '/images/styles/eldritch.png', aspect_ratio: '16:9' },
  ].map((cut, index) => ({ ...cut, cut_order: index + 1, episode_id: 'first-delivery', status: 'completed', dialogues: [], appearing_characters: ['luna'], location: 'Neon Harbor', time_of_day: 'Night' }));
  const styles = ['cyberpunk', 'anime-style', 'watercolor', 'noir'].map((name, index) => ({ id: name, name: ['Neon Cyberpunk', 'Modern Anime', 'Soft Watercolor', 'Cinematic Noir'][index], description: 'A reference style for your webtoon project.', image_url: `/images/styles/${name}.png`, reference_image_url: `/images/styles/${name}.png`, prompt: `Expressive ${name} webtoon illustration`, is_public: true }));
  const ideas = [{ id: 'idea-1', title: 'The Signal Beyond the Docks', summary: 'Luna and Kai trace a forbidden transmission to a forgotten part of the harbor.', hook: 'The message is in Luna’s own voice.' }, { id: 'idea-2', title: 'A Memory That Never Happened', summary: 'A customer pays with a memory of a future that has not happened yet.', hook: 'Can Luna change what she has already seen?' }];
  const genres = ['Fantasy', 'Romance', 'Sci-Fi', 'Slice of Life', 'Action', 'Thriller', 'Mystery', 'Comedy'].map((name, i) => ({ id: `genre-${i}`, name }));
  const workspace = { id: 'demo-studio', name: 'Demo Studio', credits: 2400, tier: 'pro', role: 'owner' };
  const json = (res, data, status = 200) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(data)); };
  return async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.replace(/^\/api\/v1/, '').replace(/\/$/, '');
    let raw = ''; for await (const chunk of req) raw += chunk;
    let body = {}; try { body = JSON.parse(raw || '{}'); } catch { return json(res, { detail: 'Expected JSON' }, 400); }
    if (req.method === 'GET') {
      if (path === '/users/me') return json(res, { id: 'demo-user', email: 'creator@example.com', language: 'en' });
      if (path === '/workspaces') return json(res, [workspace]);
      if (path === '/genres') return json(res, genres);
      if (path === '/styles') return json(res, styles);
      if (path.startsWith('/styles/')) return json(res, styles.find(s => s.id === path.split('/').pop()) || styles[0]);
      if (path === '/projects') return json(res, projects);
      if (path.startsWith('/projects/')) return json(res, projects.find(p => p.id === path.split('/')[2]) || projects[0]);
      if (path.startsWith('/characters/suggestions')) return json(res, []);
      if (path === '/characters') return json(res, characters);
      if (path.startsWith('/characters/')) return json(res, characters.find(c => c.id === path.split('/')[2]) || characters[0]);
      if (path.startsWith('/episodes/suggestions')) return json(res, ideas);
      if (path === '/episodes') return json(res, episodes);
      if (path.startsWith('/episodes/')) return json(res, episodes.find(e => e.id === path.split('/')[2]) || episodes[0]);
      if (path === '/cuts') return json(res, cuts);
      if (path.startsWith('/cuts/')) return json(res, cuts.find(c => c.id === path.split('/')[2]) || cuts[0]);
      if (path === '/assets' || path === '/templates') return json(res, []);
    }
    if (path === '/projects/worldview/augment') { await delay(); return json(res, { options: [worldview, { ...worldview, title: 'The last lighthouse', content: 'One lighthouse still remembers the city’s original name.' }, { ...worldview, title: 'The midnight archive', content: 'Every lost memory waits inside a library beneath the harbor.' }].map((v, i) => ({ ...v, id: `option-${i}`, summary: v.content })) }); }
    if (path === '/projects' && req.method === 'POST') { const project = { ...projects[0], ...body, id: `project-${projects.length + 1}`, genres: ['Fantasy', 'Mystery'] }; projects.push(project); return json(res, project); }
    if (path.startsWith('/projects/') && ['PATCH', 'PUT'].includes(req.method)) { const project = projects.find(p => p.id === path.split('/')[2]) || projects[0]; Object.assign(project, body); return json(res, project); }
    if (path === '/characters/analyze') { await delay(); return json(res, { recommended_role: 'Protagonist', lore: 'A harbor courier carrying the only memory that can bring the city back to life.', stats }); }
    if (path === '/characters/suggest') return json(res, { suggestion: body.suggestion_type === 'visuals' ? ['Silver hair', 'Neon jacket'] : 'Luna' });
    if (path === '/characters' && req.method === 'POST') { const character = { ...characters[0], ...body, id: `character-${characters.length + 1}` }; characters.push(character); return json(res, character); }
    if (/\/characters\/[^/]+\/generate$/.test(path)) { await delay(); return json(res, { status: 'completed' }); }
    if (path.includes('generate-options') || path.includes('generate-prologue-options')) { await delay(); return json(res, { options: ideas }); }
    if (path === '/episodes/generate-cuts') { await delay(); const episode = { ...episodes[0], id: `episode-${episodes.length + 1}`, title: body.episode_title, story_summary: body.episode_summary, episode_order: episodes.length + 1 }; episodes.push(episode); return json(res, { episode_id: episode.id }); }
    if (path.endsWith('/export')) {
      if (url.searchParams.get('format') !== 'zip') return json(res, {detail: 'The local demo supports ZIP export only. Use the full backend for stitched webtoon strips.'}, 501);
      // The demo exports an actual image or valid ZIP containing the three fixture panels.
      const { execFileSync } = await import('node:child_process');
      const data = url.searchParams.get('format') === 'zip' ? execFileSync('python3', ['-c', 'import io,sys,zipfile; from pathlib import Path; b=io.BytesIO(); z=zipfile.ZipFile(b,"w",zipfile.ZIP_DEFLATED); [(z.write(p,Path(p).name)) for p in sys.argv[1:]]; z.close(); sys.stdout.buffer.write(b.getvalue())', ...cuts.map(c => join(root, 'frontend/public', c.image_path))], {maxBuffer: 32 * 1024 * 1024}) : await readFile(join(root, 'frontend/public', cuts[0].image_path));
      res.writeHead(200, { 'content-type': url.searchParams.get('format') === 'zip' ? 'application/zip' : 'image/png', 'content-disposition': 'attachment; filename="toonify-demo.zip"' }); res.end(data); return;
    }
    if (path === '/scenes/structure') { await delay(); return json(res, { options: ['Wide establishing shot', 'Intimate close-up', 'Dynamic low angle'].map((label, i) => ({ id: `direction-${i}`, label, description: 'Neon reflections and cinematic lighting establish the mood.', aspect_ratio: '16:9', image_prompt: body.script })) }); }
    if (path === '/scenes/render' || path === '/scenes/modify') { await delay(); return json(res, { image_url: artwork }); }
    if (path === '/cuts' && req.method === 'POST') { const cut = { ...cuts[0], ...body, id: `cut-${cuts.length + 1}` }; cuts.push(cut); return json(res, cut); }
    if (path.startsWith('/cuts/') && ['PUT', 'PATCH'].includes(req.method)) { const cut = cuts.find(c => c.id === path.split('/')[2]); Object.assign(cut, body); return json(res, cut); }
    if (path.includes('generate-image') || path.includes('regenerate-selected')) { await delay(); return json(res, { status: 'completed' }); }
    // Unknown endpoints are visible during recording instead of silently faking success.
    console.warn(`Unimplemented demo API: ${req.method} ${path}`);
    return json(res, { detail: `Not implemented in the local demo: ${req.method} ${path}` }, 501);
  };
}
const delay = () => new Promise(resolve => setTimeout(resolve, 700));

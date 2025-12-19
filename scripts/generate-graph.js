import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

const contentDir = path.resolve('src/content');
const outputFile = path.resolve('public/galaxy-data.json');

async function generateGraph() {
    console.log('Generating knowledge graph...');

    const files = await glob(`${contentDir}/**/*.md`);
    const nodes = [];
    const links = [];
    const idMap = new Map(); // Map file path to node ID

    // 1. First pass: Create nodes
    files.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const { data } = matter(content);

        // Use relative path as ID to match links
        const relativePath = path.relative(contentDir, file).replace(/\\/g, '/');
        const id = relativePath.replace(/\.md$/, ''); // Remove extension for cleaner IDs

        const pathParts = id.split('/');
        const type = pathParts[0];
        const slug = pathParts[pathParts.length - 1];

        idMap.set(relativePath, id);

        nodes.push({
            id: id,
            slug: slug,
            type: type,
            name: data.title || id,
            category: data.category || 'Uncategorized',
            val: 1, // Base weight, will increment based on citations
            desc: data.description || '', // For bottom sheet
            filePath: relativePath // Store for linking
        });
    });

    // 2. Second pass: Create links and calculate weights
    files.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        // Regex for [[Wiki Link]]
        const wikiLinkRegex = /\[\[(.*?)\]\]/g;
        // Regex for standard markdown link [Label](./path/to/file.md)
        const mdLinkRegex = /\[.*?\]\((.*?)\)/g;

        const sourcePath = path.relative(contentDir, file).replace(/\\/g, '/');
        const sourceId = idMap.get(sourcePath);

        if (!sourceId) return;

        // Process Wiki Links
        let match;
        while ((match = wikiLinkRegex.exec(content)) !== null) {
            const targetTitle = match[1];
            // Find target node by title, ID, or slug
            const targetNode = nodes.find(n =>
                n.name === targetTitle ||
                n.id === targetTitle ||
                n.slug === targetTitle
            );

            if (targetNode && targetNode.id !== sourceId) {
                links.push({
                    source: sourceId,
                    target: targetNode.id
                });
                targetNode.val += 1; // Increase target weight
            }
        }

        // Process Standard Links
        while ((match = mdLinkRegex.exec(content)) !== null) {
            let linkPath = match[1];
            let targetNode = null;

            // 1. Handle relative paths (e.g., ./post.md, ../other/post.md)
            if (linkPath.startsWith('./') || linkPath.startsWith('../')) {
                const absoluteLinkPath = path.resolve(path.dirname(file), linkPath);
                const relativeLinkPath = path.relative(contentDir, absoluteLinkPath).replace(/\\/g, '/');
                const targetId = idMap.get(relativeLinkPath);
                if (targetId) {
                    targetNode = nodes.find(n => n.id === targetId);
                }
            }
            // 2. Handle absolute-style paths (e.g., /blog/slug, /portfolio/slug)
            else if (linkPath.startsWith('/')) {
                const parts = linkPath.split('/').filter(Boolean); // ["blog", "slug"]
                if (parts.length >= 2) {
                    const type = parts[0];
                    const slug = parts[parts.length - 1];
                    targetNode = nodes.find(n => n.type === type && n.slug === slug);
                }
            }

            if (targetNode && targetNode.id !== sourceId) {
                links.push({
                    source: sourceId,
                    target: targetNode.id
                });
                targetNode.val += 1;
            }
        }
    });

    // 3. Finalize data
    const graphData = {
        nodes: nodes,
        links: links
    };

    fs.writeFileSync(outputFile, JSON.stringify(graphData, null, 2));
    console.log(`Graph data generated with ${nodes.length} nodes and ${links.length} links.`);
}

generateGraph().catch(console.error);

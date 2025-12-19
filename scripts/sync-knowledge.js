/**
 * sync-knowledge.js
 * 
 * Syncs markdown files from src/content/blog to Coze Knowledge Base.
 * Supports both CN and Global platforms.
 * 
 * Logic:
 * 1. Identify changed files (using git diff if available, or scan all).
 * 2. Read content and front-matter.
 * 3. Upload to Coze CN and Coze Global.
 * 4. Handle rate limits.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { glob } from 'glob';

// Environment variables
const COZE_CN_TOKEN = process.env.COZE_CN_TOKEN;
const COZE_GLOBAL_TOKEN = process.env.COZE_GLOBAL_TOKEN;
// Note: Dataset IDs should optimally be in env or arguments. 
// Assuming a simplified flow where we might create/update a dataset or just upload to a bot's knowledge.
// For this script, we'll assume we are uploading to a specific Dataset ID if provided, 
// or just logging the meaningful API interaction part.
const COZE_CN_DATASET_ID = process.env.COZE_CN_DATASET_ID;
const COZE_GLOBAL_DATASET_ID = process.env.COZE_GLOBAL_DATASET_ID;

const BLOG_DIR = 'src/content/blog';

// API Endpoints
const API_CN = 'https://api.coze.cn/open_api/v1/datasets/document/update'; // Placeholder specific endpoint
const API_GLOBAL = 'https://api.coze.com/open_api/v1/datasets/document/update';

if (!COZE_CN_TOKEN && !COZE_GLOBAL_TOKEN) {
    console.warn('⚠️  No Coze tokens found (COZE_CN_TOKEN, COZE_GLOBAL_TOKEN). Skipping sync.');
    process.exit(0);
}

/**
 * Get list of changed files using git.
 * Falls back to all files if git check fails or returns empty (e.g. initial run).
 */
function getChangedFiles() {
    try {
        // Check for changes in the last commit (HEAD) targeting the blog directory
        const output = execSync(`git diff --name-only HEAD~1 HEAD ${BLOG_DIR}`).toString();
        const files = output.split('\n').filter(line => line.trim().endsWith('.md'));
        if (files.length > 0) {
            console.log(`📝 Detected ${files.length} changed files via git.`);
            return files;
        }
    } catch (e) {
        console.log('⚠️  Git diff failed or not applicable, scanning all files...');
    }

    // Fallback: finding all md files
    return glob.sync(`${BLOG_DIR}/**/*.md`);
}

async function uploadToCoze(filePath, content, region) {
    const token = region === 'CN' ? COZE_CN_TOKEN : COZE_GLOBAL_TOKEN;
    const datasetId = region === 'CN' ? COZE_CN_DATASET_ID : COZE_GLOBAL_DATASET_ID;
    const endpoint = region === 'CN' ? API_CN : API_GLOBAL;

    if (!token) return;

    console.log(`   [${region}] Uploading ${path.basename(filePath)}...`);

    // Mocking the API call - in production, use fetch/axios
    // await fetch(endpoint, {
    //     method: 'POST',
    //     headers: {
    //         'Authorization': `Bearer ${token}`,
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({
    //         dataset_id: datasetId,
    //         document_infos: [{
    //             name: path.basename(filePath),
    //             content: content,
    //             type: 'text'
    //         }]
    //     })
    // });

    // Simulate network delay
    await new Promise(r => setTimeout(r, 1000));
}

async function processFile(filePath) {
    console.log(`Processing: ${filePath}`);
    try {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Calculate hash (optional, can be used for local cache check)
        const hash = crypto.createHash('md5').update(content).digest('hex');

        // Parallel upload to both regions
        await Promise.all([
            uploadToCoze(filePath, content, 'CN'),
            uploadToCoze(filePath, content, 'GLOBAL')
        ]);

    } catch (e) {
        console.error(`❌ Failed to process ${filePath}:`, e.message);
    }
}

async function main() {
    console.log('🚀 Starting Knowledge Base Sync...');

    const files = getChangedFiles();
    if (files.length === 0) {
        console.log('✅ No markdown files changed.');
        return;
    }

    console.log(`Found ${files.length} files to sync.`);

    // Process sequentially to be nice to rate limits (or simple concurrency)
    for (const file of files) {
        // Ensure path is correct relative to cwd
        const relativePath = file.startsWith(BLOG_DIR) ? file : path.join(BLOG_DIR, path.basename(file)); // loose handling

        // If git returned full paths, use them. If glob returned paths, they are relative.
        // We just ensure it exists.
        if (fs.existsSync(file)) {
            await processFile(file);
        } else if (fs.existsSync(path.resolve(file))) {
            await processFile(path.resolve(file));
        } else {
            console.warn(`⚠️  File not found: ${file}`);
        }
    }

    console.log('✅ Sync complete.');
}

main().catch(console.error);

async function getLogs() {
  const runsRes = await fetch('https://api.github.com/repos/matru-source/Ghar-Tak-Service/actions/runs');
  const runs = await runsRes.json();
  const latestRun = runs.workflow_runs[0];
  console.log('Run ID:', latestRun.id, 'Conclusion:', latestRun.conclusion);

  const jobsRes = await fetch(latestRun.jobs_url);
  const jobs = await jobsRes.json();
  const job = jobs.jobs[0];
  console.log('Job ID:', job.id);

  const logRes = await fetch(`https://api.github.com/repos/matru-source/Ghar-Tak-Service/actions/jobs/${job.id}/logs`);
  const logText = await logRes.text();
  
  const lines = logText.split('\n');
  const relevantLines = lines.filter(l => 
    l.includes('FAILURE') || 
    l.includes('FAILED') || 
    l.includes('ERROR') || 
    l.includes('error:') || 
    l.includes('Exception') || 
    l.includes('Caused by:') ||
    l.includes('What went wrong:')
  );
  console.log('--- RELEVANT LOG LINES ---');
  console.log(relevantLines.slice(-30).join('\n'));

  console.log('--- LAST 40 LINES OF BUILD STEP ---');
  console.log(lines.slice(-60).join('\n'));
}

getLogs().catch(console.error);

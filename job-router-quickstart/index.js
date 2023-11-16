const createClient = require('@azure-rest/communication-job-router').default;

const main = async () => {
  console.log("Azure Communication Services - Job Router Quickstart")

  const connectionString = process.env["COMMUNICATION_CONNECTION_STRING"] ||
    "endpoint=https://<resource-name>.communication.azure.com/;<access-key>";
  const client = createClient(connectionString);
  
  const distributionPolicy = await client.path("/routing/distributionPolicies/{distributionPolicyId}", "distribution-policy-1").patch({
    body: {
      offerExpiresAfterSeconds: 60,
      mode: { kind: "longest-idle" },
      name: "My distribution policy"
    },
    contentType: "application/merge-patch+json"
  });

  const queue = await client.path("/routing/queues/{queueId}", "queue-1").patch({
    body: {
      name: "My Queue",
      distributionPolicyId: distributionPolicy.body.id
    },
    contentType: "application/merge-patch+json"
  });

  const job = await client.path("/routing/jobs/{jobId}", "job-1").patch({
    body: {
      channelId: "voice",
      queueId: queue.body.id,
      priority: 1,
      requestedWorkerSelectors: [{ key: "Some-Skill", labelOperator: "greaterThan", value: 10 }]
    },
    contentType: "application/merge-patch+json"
  });

  let worker = await client.path("/routing/workers/{workerId}", "worker-1").patch({
    body:  {
        capacity: 1,
        queues: [queue.body.id],
        labels: { "Some-Skill": 11 },
        channels: [ { channelId: "voice", capacityCostPerJob: 1 } ],
        availableForOffers: true
    },
    contentType: "application/merge-patch+json"
  });

  await new Promise(r => setTimeout(r, 10000));
  worker = await client.path("/routing/workers/{workerId}", worker.body.id).get();
  for (const offer of worker.body.offers) {
      console.log(`Worker ${worker.body.id} has an active offer for job ${offer.jobId}`);
  }

  const accept = await client.path("/routing/workers/{workerId}/offers/{offerId}:accept",
      worker.body.id, worker.body.offers[0].offerId).post();
  console.log(`Worker ${worker.body.id} is assigned job ${accept.body.jobId}`);

  await client.path("/routing/jobs/{jobId}:complete", accept.body.jobId).post({
    body: { assignmentId: accept.body.assignmentId }
  });
  console.log(`Worker ${worker.body.id} has completed job ${accept.body.jobId}`);

  await client.path("/routing/jobs/{jobId}:complete", accept.body.jobId).post({
    body: { assignmentId: accept.assignmentId, dispositionCode: "Resolved" }
  });
  console.log(`Worker ${worker.body.id} has closed job ${accept.body.jobId}`);

  await client.path("/routing/jobs/{jobId}", accept.body.jobId).delete();
  console.log(`Deleting job ${accept.body.jobId}`);
};

main().catch((error) => {
  console.log("Encountered an error:\n");
  console.log(error);
})

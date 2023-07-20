const { JobRouterClient, JobRouterAdministrationClient } = require('@azure/communication-job-router');

const main = async () => {
  console.log("Azure Communication Services - Job Router Quickstart")

  // create JobRouterAdministrationClient and JobRouterClient
  const connectionString = process.env["COMMUNICATION_CONNECTION_STRING"] ||
    "endpoint=https://<resource-name>.communication.azure.com/;<access-key>";
  const routerAdminClient = new JobRouterAdministrationClient(connectionString);
  const routerClient = new JobRouterClient(connectionString);

  const distributionPolicy = await routerAdminClient.createDistributionPolicy("distribution-policy-1", {
    offerExpiresAfterSeconds: 60,
    mode: { kind: "longest-idle" },
    name: "My distribution policy"
  });

  const queue = await routerAdminClient.createQueue("queue-1", {
    name: "My Queue",
    distributionPolicyId: distributionPolicy.id
  });

  const job = await routerClient.createJob("job-1", {
    channelId: "voice",
    queueId: queue.id,
    priority: 1,
    requestedWorkerSelectors: [{ key: "Some-Skill", labelOperator: "greaterThan", value: 10 }]
  });

  let worker = await routerClient.createWorker("worker-1", {
    totalCapacity: 1,
    queueIds: { [queue.id]: {} },
    labels: { "Some-Skill": 11 },
    channelConfigurations: { "voice": { capacityCostPerJob: 1 } },
    availableForOffers: true
  });

  await new Promise(r => setTimeout(r, 3000));
  worker = await routerClient.getWorker(worker.id);
  for (const offer of worker.offers) {
      console.log(`Worker ${worker.id} has an active offer for job ${offer.jobId}`);
  }

  const accept = await routerClient.acceptJobOffer(worker.id, worker.offers[0].offerId);
  console.log(`Worker ${worker.id} is assigned job ${accept.jobId}`);

  await routerClient.completeJob("job-1", accept.assignmentId);
  console.log(`Worker ${worker.id} has completed job ${accept.jobId}`);

  await routerClient.closeJob("job-1", accept.assignmentId, { dispositionCode: "Resolved" });
  console.log(`Worker ${worker.id} has closed job ${accept.jobId}`);

  await routerClient.deleteJob(accept.jobId);
  console.log(`Deleting job ${accept.jobId}`);
};

main().catch((error) => {
  console.log("Encountered an error:\n");
  console.log(error);
})
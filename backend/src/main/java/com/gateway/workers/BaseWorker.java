package com.gateway.workers;

import org.springframework.data.redis.core.RedisTemplate;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

public abstract class BaseWorker implements Runnable {

    protected final RedisTemplate<String, Object> redisTemplate;
    protected final String queueName;
    private volatile boolean running = true;

    public BaseWorker(RedisTemplate<String, Object> redisTemplate, String queueName) {
        this.redisTemplate = redisTemplate;
        this.queueName = queueName;
    }

    @Override
    public void run() {
        while (running) {
            try {
                // BRPOP with 5 seconds timeout
                Object job = redisTemplate.opsForList().leftPop(queueName, Duration.ofSeconds(5));
                if (job != null) {
                    process(job);
                }
            } catch (Exception e) {
                e.printStackTrace();
                // Sleep to avoid tight loop on persistent error
                try { Thread.sleep(1000); } catch (InterruptedException ie) {}
            }
        }
    }

    protected abstract void process(Object job);

    public void stop() {
        this.running = false;
    }
}

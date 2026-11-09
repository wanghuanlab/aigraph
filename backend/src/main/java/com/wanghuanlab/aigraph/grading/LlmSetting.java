package com.wanghuanlab.aigraph.grading;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "llm_settings")
public class LlmSetting {
    @Id
    public byte id;

    @Column(name = "base_url", nullable = false, length = 300)
    public String baseUrl;

    @Column(name = "model_name", nullable = false, length = 80)
    public String modelName;

    @Column(name = "api_key", nullable = false, length = 256)
    public String apiKey;
}

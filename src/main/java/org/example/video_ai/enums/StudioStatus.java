package org.example.video_ai.enums;
/*
* 视频制片厂申请状态
* */

public enum StudioStatus {
    //未申请
    NONE("Not a studio applicant"),
    //申请中
    PENDING("Waiting for admin approval"),
    //审核通过
    APPROVED("Approved studio"),
    //审核驳回
    REJECTED("Rejected studio");

    private final String description;

    StudioStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
